import { getPool } from '../../db/client.js';
import { EmbeddingClient } from '../../llm/providers/embeddings.js';
import { decrypt } from '../../utils/crypto.js';

function cosineSimilarity(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length === 0 || right.length === 0) return 0;
  const dimensions = Math.min(left.length, right.length);
  let dot = 0, leftNorm = 0, rightNorm = 0;
  for (let i = 0; i < dimensions; i++) {
    dot += left[i] * right[i];
    leftNorm += left[i] * left[i];
    rightNorm += right[i] * right[i];
  }
  if (leftNorm === 0 || rightNorm === 0) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function normalizeVector(rawVector) {
  if (Array.isArray(rawVector)) {
    return rawVector.map((value) => Number(value));
  }

  if (typeof rawVector === 'string') {
    return rawVector
      .replace(/^\{/, '')
      .replace(/\}$/, '')
      .split(',')
      .filter((value) => value.length > 0)
      .map((value) => Number(value));
  }

  return [];
}

function normalizeMetadata(metadata) {
  if (!metadata) {
    return {};
  }

  if (typeof metadata === 'string') {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }

  return metadata;
}

export class Retriever {
  constructor(db = getPool(), embeddingClient = new EmbeddingClient()) {
    this.db = db;
    this.embeddingClient = embeddingClient;
  }

  async retrieve(query, topK = 4) {
    if (typeof query !== 'string' || query.trim().length === 0) {
      return [];
    }

    const limit = Number.isFinite(topK) ? Math.max(0, Math.floor(topK)) : 4;

    if (limit === 0) {
      return [];
    }

    const queryEmbedding = await this.embeddingClient.embedText(query);
    const result = await this.db.query(
      `
        SELECT id, source_path, checksum, chunk_index, content, metadata, embedding
        FROM rag_chunks
      `
    );

    return result.rows
      .map((row) => {
        const metadata = normalizeMetadata(row.metadata);
        const embedding = normalizeVector(row.embedding);

        return {
          id: row.id,
          sourcePath: row.source_path,
          checksum: row.checksum,
          chunkIndex: row.chunk_index,
          similarity: cosineSimilarity(queryEmbedding.vector, embedding),
          encryptedContent: row.content,
          metadata,
        };
      })
      .sort((left, right) => right.similarity - left.similarity)
      .slice(0, limit)
      .map((match) => ({
        id: match.id,
        sourcePath: match.sourcePath,
        checksum: match.checksum,
        chunkIndex: match.chunkIndex,
        similarity: match.similarity,
        metadata: match.metadata,
        content: decrypt(match.encryptedContent),
      }));
  }
}
