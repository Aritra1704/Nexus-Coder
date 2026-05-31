import * as registry from '../tools/registry.js';
import { config } from '../config.js';
import { OllamaClient } from '../llm/providers/ollama.js';
import { z } from 'zod';

const replacePayloadSchema = z.object({
  oldContent: z.string().min(1),
  newContent: z.string(),
});

function parseReplacePayload(text) {
  if (typeof text !== 'string') {
    throw new Error('Ollama returned a non-text response for surgical file edit');
  }

  const trimmed = text.trim();
  const withoutFences = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed;

  try {
    parsed = JSON.parse(withoutFences);
  } catch (error) {
    throw new Error(`Failed to parse Ollama surgical edit response as JSON: ${error.message}`);
  }

  return replacePayloadSchema.parse(parsed);
}

async function requestSurgicalEdit(client, filePath, objective, fileContent) {
  const response = await fetch(`${client.baseUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: client.model,
      stream: false,
      messages: [
        {
          role: 'system',
          content: [
            'You are performing a surgical code edit.',
            'Find the exact block of code that needs to change.',
            'Return JSON only with this exact shape: {"oldContent":"...","newContent":"..."}',
            'oldContent must appear verbatim in the file content.',
            'Do not include markdown fences or any explanation.',
          ].join(' '),
        },
        {
          role: 'user',
          content: [
            `Path: ${filePath}`,
            `Objective: ${objective}`,
            'Current file content:',
            fileContent,
          ].join('\n\n'),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama surgical edit request failed: HTTP ${response.status} ${response.statusText}`);
  }

  const payload = await response.json();
  return payload.message?.content ?? '';
}

export async function patch(path, objective, workspaceRoot = config.workspaceRoot) {
  const readResult = await registry.runTool('read_file', { path }, workspaceRoot);
  const client = new OllamaClient({ model: config.modelCoder });
  const modelResponse = await requestSurgicalEdit(client, path, objective, readResult.content);
  const { oldContent, newContent } = parseReplacePayload(modelResponse);

  return await registry.runTool('replace', { path, oldContent, newContent }, workspaceRoot);
}
