import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { z } from 'zod';

import { config } from '../../config.js';
import { TOOL_DEFINITIONS } from '../../tools/registry.js';

function getSchemaDescription(schema) {
  return schema?._def?.description;
}

function isOptionalSchema(schema) {
  return (
    schema instanceof z.ZodOptional ||
    schema instanceof z.ZodDefault
  );
}

function unwrapSchema(schema) {
  let current = schema;
  let nullable = false;

  while (current) {
    if (current instanceof z.ZodNullable) {
      nullable = true;
      current = current.unwrap();
      continue;
    }

    if (current instanceof z.ZodOptional) {
      current = current.unwrap();
      continue;
    }

    if (current instanceof z.ZodDefault) {
      current = current.removeDefault();
      continue;
    }

    if (current instanceof z.ZodEffects) {
      current = current.innerType();
      continue;
    }

    break;
  }

  return { schema: current, nullable };
}

function zodSchemaToGeminiSchema(schema) {
  const { schema: unwrappedSchema, nullable } = unwrapSchema(schema);
  const description = getSchemaDescription(schema) ?? getSchemaDescription(unwrappedSchema);

  let geminiSchema;

  if (unwrappedSchema instanceof z.ZodString) {
    geminiSchema = { type: SchemaType.STRING };
  } else if (unwrappedSchema instanceof z.ZodNumber) {
    const isInteger = unwrappedSchema._def.checks?.some((check) => check.kind === 'int');
    geminiSchema = { type: isInteger ? SchemaType.INTEGER : SchemaType.NUMBER };
  } else if (unwrappedSchema instanceof z.ZodBoolean) {
    geminiSchema = { type: SchemaType.BOOLEAN };
  } else if (unwrappedSchema instanceof z.ZodEnum) {
    geminiSchema = {
      type: SchemaType.STRING,
      enum: [...unwrappedSchema.options],
    };
  } else if (unwrappedSchema instanceof z.ZodNativeEnum) {
    geminiSchema = {
      type: SchemaType.STRING,
      enum: Object.values(unwrappedSchema.enum).filter((value) => typeof value === 'string'),
    };
  } else if (unwrappedSchema instanceof z.ZodArray) {
    geminiSchema = {
      type: SchemaType.ARRAY,
      items: zodSchemaToGeminiSchema(unwrappedSchema.element),
    };
  } else if (unwrappedSchema instanceof z.ZodObject) {
    const shape = typeof unwrappedSchema._def.shape === 'function'
      ? unwrappedSchema._def.shape()
      : unwrappedSchema.shape;
    const properties = {};
    const required = [];

    for (const [key, value] of Object.entries(shape)) {
      properties[key] = zodSchemaToGeminiSchema(value);

      if (!isOptionalSchema(value)) {
        required.push(key);
      }
    }

    geminiSchema = {
      type: SchemaType.OBJECT,
      properties,
    };

    if (required.length > 0) {
      geminiSchema.required = required;
    }
  } else {
    throw new Error(`Unsupported Zod schema for Gemini tool conversion: ${unwrappedSchema?._def?.typeName ?? 'unknown'}`);
  }

  if (description) {
    geminiSchema.description = description;
  }

  if (nullable) {
    geminiSchema.nullable = true;
  }

  return geminiSchema;
}

function normalizeTextParts(content) {
  if (typeof content === 'string') {
    return content.length > 0 ? [{ text: content }] : [];
  }

  if (Array.isArray(content)) {
    return content.flatMap((part) => {
      if (typeof part === 'string') {
        return [{ text: part }];
      }

      if (part?.text && typeof part.text === 'string') {
        return [{ text: part.text }];
      }

      return [];
    });
  }

  if (content && typeof content === 'object' && typeof content.text === 'string') {
    return [{ text: content.text }];
  }

  return [];
}

function normalizeFunctionResponsePayload(payload) {
  if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
    return payload;
  }

  return { value: payload };
}

function messageToGeminiContent(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('Each message must be an object');
  }

  if (message.role === 'system') {
    return null;
  }

  if (message.role === 'tool' || message.role === 'function') {
    const functionName = message.name ?? message.toolName;

    if (!functionName) {
      throw new Error('Tool/function messages must include a name');
    }

    return {
      role: 'function',
      parts: [
        {
          functionResponse: {
            name: functionName,
            response: normalizeFunctionResponsePayload(
              message.response ?? message.content ?? null
            ),
          },
        },
      ],
    };
  }

  const parts = normalizeTextParts(message.content);

  if (message.role === 'assistant' && Array.isArray(message.toolCalls)) {
    for (const toolCall of message.toolCalls) {
      if (!toolCall?.name) {
        throw new Error('Assistant tool calls must include a name');
      }

      parts.push({
        functionCall: {
          name: toolCall.name,
          args: toolCall.args ?? {},
        },
      });
    }
  }

  const role = message.role === 'assistant' ? 'model' : 'user';

  if (parts.length === 0) {
    throw new Error(`Message for role ${message.role} has no supported content`);
  }

  return { role, parts };
}

function formatMessagesForGemini(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('generateResponse requires a non-empty messages array');
  }

  const systemMessages = [];
  const contents = [];

  for (const message of messages) {
    if (message?.role === 'system') {
      const systemParts = normalizeTextParts(message.content);

      if (systemParts.length > 0) {
        systemMessages.push(...systemParts);
      }

      continue;
    }

    const content = messageToGeminiContent(message);

    if (content) {
      contents.push(content);
    }
  }

  if (contents.length === 0) {
    throw new Error('No non-system messages were provided to Gemini');
  }

  return {
    contents,
    systemInstruction: systemMessages.length > 0
      ? { role: 'system', parts: systemMessages }
      : undefined,
  };
}

function normalizeGeminiError(error) {
  const message = error?.message ?? 'Unknown Gemini API error';
  const status = error?.status ?? error?.code ?? null;
  const upperMessage = message.toUpperCase();

  if (status === 429 || upperMessage.includes('RATE LIMIT') || upperMessage.includes('RESOURCE_EXHAUSTED')) {
    const rateLimitError = new Error(`Gemini rate limit exceeded: ${message}`);
    rateLimitError.code = 'GEMINI_RATE_LIMIT';
    rateLimitError.cause = error;
    return rateLimitError;
  }

  const apiError = new Error(`Gemini API request failed: ${message}`);
  apiError.code = 'GEMINI_API_ERROR';
  apiError.cause = error;
  return apiError;
}

export class GeminiClient {
  constructor({
    apiKey = config.geminiApiKey,
    model = config.modelPlanner,
  } = {}) {
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    this.apiKey = apiKey;
    this.model = model;
    this.client = new GoogleGenerativeAI(apiKey);
  }

  convertToolDefinitionsToGeminiTools(toolDefinitions = TOOL_DEFINITIONS) {
    if (!Array.isArray(toolDefinitions) || toolDefinitions.length === 0) {
      return [];
    }

    return [
      {
        functionDeclarations: toolDefinitions.map((tool) => ({
          name: tool.name,
          description: tool.description,
          parameters: zodSchemaToGeminiSchema(tool.argsSchema),
        })),
      },
    ];
  }

  async generateResponse({
    messages,
    tools = TOOL_DEFINITIONS,
    model = this.model,
  }) {
    const geminiTools = Array.isArray(tools) && tools.length > 0
      ? this.convertToolDefinitionsToGeminiTools(tools)
      : undefined;
    const { contents, systemInstruction } = formatMessagesForGemini(messages);
    const generativeModel = this.client.getGenerativeModel({ model });

    try {
      const result = await generativeModel.generateContent({
        contents,
        tools: geminiTools,
        systemInstruction,
      });
      const response = result.response;
      const functionCalls = response.functionCalls?.() ?? [];
      const text = functionCalls.length === 0
        ? response.text?.() ?? ''
        : '';

      if (functionCalls.length > 0) {
        return {
          type: 'tool_calls',
          toolCalls: functionCalls.map((call, index) => ({
            id: call.id ?? `${call.name}-${index + 1}`,
            name: call.name,
            args: call.args ?? {},
          })),
          text,
          usage: response.usageMetadata ?? null,
          rawResponse: response,
        };
      }

      return {
        type: 'text',
        text,
        toolCalls: [],
        usage: response.usageMetadata ?? null,
        rawResponse: response,
      };
    } catch (error) {
      throw normalizeGeminiError(error);
    }
  }
}
