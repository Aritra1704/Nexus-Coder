import { config } from '../../config.js';
import { TOOL_DEFINITIONS } from '../../tools/registry.js';

function buildToolInstructions(toolDefinitions) {
  const toolList = toolDefinitions.map((tool) => ({
    name: tool.name,
    description: tool.description,
    parameters: Object.keys(tool.argsSchema.shape ?? {}),
  }));

  return [
    'You are the local backup planner for a coding orchestrator.',
    'You may use tools, but this model must request them manually in JSON.',
    'Available tools:',
    JSON.stringify(toolList, null, 2),
    'If you want to call a tool, respond with JSON only in exactly this shape:',
    JSON.stringify(
      {
        type: 'tool_call',
        name: 'tool_name',
        args: {},
        reasoning: 'one short sentence explaining why this tool is needed',
      },
      null,
      2
    ),
    'If the task is complete, do not emit JSON. Return a concise plain-text final summary instead.',
    'Do not wrap JSON in markdown fences.',
  ].join('\n');
}

function tryParseJsonObject(text) {
  if (typeof text !== 'string') {
    return null;
  }

  const trimmed = text.trim();
  const withoutFences = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  const candidates = [trimmed, withoutFences];

  for (const candidate of candidates) {
    if (!candidate.startsWith('{') || !candidate.endsWith('}')) {
      continue;
    }

    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return null;
}

function formatMessageContent(message) {
  if (typeof message.content === 'string') {
    return message.content;
  }

  if (message.content === undefined || message.content === null) {
    return '';
  }

  return JSON.stringify(message.content, null, 2);
}

function convertMessagesForOllama(messages, toolDefinitions) {
  const systemMessages = [];
  const chatMessages = [];

  for (const message of messages) {
    if (message?.role === 'system') {
      const content = formatMessageContent(message);

      if (content) {
        systemMessages.push(content);
      }

      continue;
    }

    if (message?.role === 'tool' || message?.role === 'function') {
      chatMessages.push({
        role: 'user',
        content: `Tool result from ${message.name ?? message.toolName}:\n${formatMessageContent(message)}`,
      });
      continue;
    }

    if (message?.role === 'assistant' && Array.isArray(message.toolCalls) && message.toolCalls.length > 0) {
      const toolCallSummary = message.toolCalls.map((toolCall) => ({
        name: toolCall.name,
        args: toolCall.args ?? {},
      }));

      const content = formatMessageContent(message);
      chatMessages.push({
        role: 'assistant',
        content: [
          content,
          `Tool request issued:\n${JSON.stringify(toolCallSummary, null, 2)}`,
        ].filter(Boolean).join('\n\n'),
      });
      continue;
    }

    chatMessages.push({
      role: message.role === 'assistant' ? 'assistant' : 'user',
      content: formatMessageContent(message),
    });
  }

  const systemPrompt = [
    ...systemMessages,
    buildToolInstructions(toolDefinitions),
  ].join('\n\n');

  return {
    systemPrompt,
    messages: [
      { role: 'system', content: systemPrompt },
      ...chatMessages,
    ],
  };
}

function normalizeOllamaError(error) {
  const message = error?.message ?? 'Unknown Ollama API error';
  const apiError = new Error(`Ollama API request failed: ${message}`);
  apiError.code = 'OLLAMA_API_ERROR';
  apiError.cause = error;
  return apiError;
}

export class OllamaClient {
  constructor({
    baseUrl = config.ollamaBaseUrl,
    model = config.modelCoder,
  } = {}) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  async generateResponse({
    messages,
    tools = TOOL_DEFINITIONS,
    model = this.model,
  }) {
    const { messages: ollamaMessages } = convertMessagesForOllama(messages, tools);

    let response;

    try {
      response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          stream: false,
          messages: ollamaMessages,
        }),
      });
    } catch (error) {
      throw normalizeOllamaError(error);
    }

    if (!response.ok) {
      throw normalizeOllamaError(
        new Error(`HTTP ${response.status} ${response.statusText}`)
      );
    }

    const payload = await response.json();
    const message = payload.message ?? {};
    const content = message.content ?? '';
    const parsed = tryParseJsonObject(content);

    if (parsed?.type === 'tool_call' && typeof parsed.name === 'string') {
      return {
        type: 'tool_calls',
        text: parsed.reasoning ?? '',
        toolCalls: [
          {
            id: `${parsed.name}-1`,
            name: parsed.name,
            args: parsed.args && typeof parsed.args === 'object' ? parsed.args : {},
          },
        ],
        usage: {
          prompt_eval_count: payload.prompt_eval_count ?? null,
          eval_count: payload.eval_count ?? null,
          total_duration: payload.total_duration ?? null,
        },
        rawResponse: payload,
      };
    }

    return {
      type: 'text',
      text: content,
      toolCalls: [],
      usage: {
        prompt_eval_count: payload.prompt_eval_count ?? null,
        eval_count: payload.eval_count ?? null,
        total_duration: payload.total_duration ?? null,
      },
      rawResponse: payload,
    };
  }
}
