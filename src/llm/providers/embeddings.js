import { GoogleGenerativeAI, TaskType } from '@google/generative-ai';

import { config } from '../../config.js';

function normalizeEmbeddingError(prefix, error) {
  const message = error?.message ?? 'Unknown embedding error';
  const wrapped = new Error(`${prefix}: ${message}`);
  wrapped.cause = error;
  return wrapped;
}

export class EmbeddingClient {
  constructor({
    geminiApiKey = config.geminiApiKey,
    ollamaBaseUrl = config.ollamaBaseUrl,
    geminiModel = 'gemini-embedding-2',
    ollamaModel = 'nomic-embed-text',
    preferredProvider = geminiApiKey ? 'gemini' : 'ollama',
  } = {}) {
    this.geminiApiKey = geminiApiKey;
    this.ollamaBaseUrl = ollamaBaseUrl.replace(/\/$/, '');
    this.geminiModel = geminiModel;
    this.ollamaModel = ollamaModel;
    this.preferredProvider = preferredProvider;
    this.gemini = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
  }

  async embedText(text, { provider = this.preferredProvider } = {}) {
    if (!text || typeof text !== 'string') {
      throw new Error('embedText requires a non-empty string');
    }

    if (provider === 'gemini') {
      try {
        return await this.embedWithGemini(text);
      } catch (error) {
        if (!this.ollamaBaseUrl) {
          throw error;
        }

        return this.embedWithOllama(text);
      }
    }

    return this.embedWithOllama(text);
  }

  async embedWithGemini(text) {
    if (!this.gemini) {
      throw new Error('Gemini API key is not configured for embeddings');
    }

    try {
      const model = this.gemini.getGenerativeModel({ model: this.geminiModel });
      const response = await model.embedContent({
        content: {
          role: 'user',
          parts: [{ text }],
        },
        taskType: TaskType.RETRIEVAL_DOCUMENT,
      });

      const values = response?.embedding?.values;

      if (!Array.isArray(values) || values.length === 0) {
        throw new Error('Gemini returned an empty embedding vector');
      }

      return {
        provider: 'gemini',
        model: this.geminiModel,
        vector: values,
      };
    } catch (error) {
      throw normalizeEmbeddingError('Gemini embedding request failed', error);
    }
  }

  async embedWithOllama(text) {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/embed`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.ollamaModel,
          input: text,
          truncate: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const payload = await response.json();
      const vector = payload?.embeddings?.[0];

      if (!Array.isArray(vector) || vector.length === 0) {
        throw new Error('Ollama returned an empty embedding vector');
      }

      return {
        provider: 'ollama',
        model: payload.model ?? this.ollamaModel,
        vector,
      };
    } catch (error) {
      throw normalizeEmbeddingError('Ollama embedding request failed', error);
    }
  }
}
