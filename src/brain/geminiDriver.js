import { GeminiClient } from '../llm/providers/gemini.js';
import { OllamaClient } from '../llm/providers/ollama.js';
import { config } from '../config.js';
import { saveArtifact } from '../memory/exactArtifacts.js';
import { Retriever } from '../memory/rag/retriever.js';
import { broadcastTaskUpdate } from '../telegram/bot.js';
import { TOOL_DEFINITIONS } from '../tools/registry.js';

function formatRelevantContext(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    return '';
  }

  return [
    'Relevant Project Context:',
    ...matches.map((match, index) => {
      const score = Number.isFinite(match.similarity) ? match.similarity.toFixed(3) : '0.000';
      return [
        `${index + 1}. ${match.sourcePath} (chunk ${match.chunkIndex}, score ${score})`,
        match.content,
      ].join('\n');
    }),
  ].join('\n\n');
}

export class GeminiDriver {
  constructor(registry, hooks = {}) {
    this.registry = registry;
    this.hooks = hooks;
    this.geminiClient = new GeminiClient({ model: config.modelPlanner });
    this.ollamaClient = new OllamaClient({ model: config.modelCoder });
    this.retriever = hooks.retriever ?? new Retriever();
    this.telegramBot = hooks.telegramBot ?? { broadcastTaskUpdate };
    this.maxSteps = hooks.maxSteps ?? 25;
  }

  async runLoop(task) {
    const taskObjective = task.objective ?? task.payload?.objective ?? 'Complete the assigned task.';
    await this.notifyTaskUpdate(task.id ?? 'unknown', `Started: ${taskObjective}`);
    let state = await this.loadState(task);

    while (!state.isDone && state.stepCount < this.maxSteps) {
      this.hooks.runtimeUpdate?.({ phase: 'analyzing', detail: 'Planning next step' });

      const decision = await this.decide(state);

      if (decision.type === 'final') {
        state.messages.push({
          role: 'assistant',
          content: decision.summary,
        });
        state.finalSummary = decision.summary;
        state.isDone = true;

        await this.persistReasoning(state, decision.summary);
        await this.saveCheckpoint(state);
        await this.notifyTaskUpdate(state.task.id ?? 'unknown', `Final Summary:\n${decision.summary}`);
        break;
      }

      this.hooks.runtimeUpdate?.({
        phase: 'executing',
        detail: `Executing: ${decision.toolCall.name}`,
      });

      state.messages.push({
        role: 'assistant',
        content: decision.text ?? '',
        toolCalls: [
          {
            name: decision.toolCall.name,
            args: decision.toolCall.args,
          },
        ],
      });

      await this.persistReasoning(state, decision.text ?? '');

      const executionResult = await this.executeAction(decision.toolCall);
      const toolResponsePayload = {
        tool: decision.toolCall.name,
        args: decision.toolCall.args,
        result: executionResult,
      };

      state.messages.push({
        role: 'tool',
        name: decision.toolCall.name,
        content: toolResponsePayload,
      });
      state.stepCount += 1;

      await this.persistToolResult(state, toolResponsePayload);
      await this.saveCheckpoint(state);
    }

    if (!state.isDone && state.stepCount >= this.maxSteps) {
      throw new Error(`GeminiDriver exceeded maxSteps (${this.maxSteps}) without producing a final summary`);
    }

    return state;
  }

  async decide(state) {
    let response;

    try {
      response = await this.geminiClient.generateResponse({
        messages: state.messages,
        tools: TOOL_DEFINITIONS,
        model: config.modelPlanner,
      });
    } catch (error) {
      const fallbackMessage = 'Arnold switched to local backup';
      this.hooks.runtimeUpdate?.({
        phase: 'fallback',
        detail: `${fallbackMessage}: ${error.message}`,
      });
      console.warn(`${fallbackMessage}: ${error.message}`);

      response = await this.ollamaClient.generateResponse({
        messages: state.messages,
        tools: TOOL_DEFINITIONS,
        model: config.modelCoder,
      });
    }

    if (response.type === 'tool_calls' && response.toolCalls.length > 0) {
      return {
        type: 'tool_call',
        text: response.text,
        toolCall: response.toolCalls[0],
      };
    }

    return {
      type: 'final',
      summary: response.text,
    };
  }

  async executeAction(action) {
    try {
      return await this.registry.runTool(action.name, action.args ?? {}, config.workspaceRoot);
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async verify(executionResult) {
    // TODO: Implement GitGuardian verification
    return { status: 'passed', summary: 'Verified' };
  }

  async notifyTaskUpdate(taskId, message) {
    try {
      await this.telegramBot.broadcastTaskUpdate(taskId, message);
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.hooks.runtimeUpdate?.({
        phase: 'telegram',
        detail: `Telegram update failed: ${detail}`,
      });
      console.warn(`GeminiDriver Telegram notification failed: ${detail}`);
    }
  }

  async loadState(task) {
    const systemPrompt = [
      'You are a surgical coding orchestrator.',
      'Use available tools when needed to inspect files, edit files, or run commands.',
      'After each tool result, continue toward the objective.',
      'When the task is complete, respond with a concise final summary and no tool calls.',
    ].join(' ');
    const taskObjective = task.objective ?? task.payload?.objective ?? 'Complete the assigned task.';
    const priorMessages = Array.isArray(task.messages) ? task.messages : [];
    let relevantContext = '';

    try {
      relevantContext = formatRelevantContext(await this.retriever.retrieve(taskObjective, 3));
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.hooks.runtimeUpdate?.({
        phase: 'memory',
        detail: `RAG context unavailable: ${detail}`,
      });
      console.warn(`GeminiDriver RAG retrieval failed: ${detail}`);
    }

    const userMessageContent = [
      `Task ID: ${task.id ?? 'unknown'}`,
      `Objective: ${taskObjective}`,
      relevantContext,
    ].filter(Boolean).join('\n\n');

    return {
      isDone: false,
      task,
      stepCount: 0,
      finalSummary: null,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: userMessageContent,
        },
        ...priorMessages,
      ],
    };
  }

  async updateState(state, verification) {
    return { ...state, isDone: true };
  }

  async saveCheckpoint(state) {
    await saveArtifact(state.task.id ?? null, 'gemini_checkpoint', {
      isDone: state.isDone,
      stepCount: state.stepCount,
      finalSummary: state.finalSummary,
      messageCount: state.messages.length,
    });
  }

  async persistReasoning(state, reasoningText) {
    if (!reasoningText) {
      return;
    }

    await saveArtifact(state.task.id ?? null, `gemini_reasoning_step_${state.stepCount + 1}`, {
      step: state.stepCount + 1,
      reasoning: reasoningText,
    });
  }

  async persistToolResult(state, toolResult) {
    await saveArtifact(state.task.id ?? null, `gemini_tool_result_step_${state.stepCount}`, {
      step: state.stepCount,
      ...toolResult,
    });
  }
}
