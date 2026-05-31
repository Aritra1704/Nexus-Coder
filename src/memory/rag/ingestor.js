import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getPool } from '../../db/client.js';
import { EmbeddingClient } from '../../llm/providers/embeddings.js';
import { encrypt } from '../../utils/crypto.js';
import { chunkText } from './chunker.js';

function createChecksum(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export class Ingestor {
  constructor(db = getPool(), embeddingClient = new EmbeddingClient(), runtimeConfig = {}) {
    this.db = db;
    this.embeddingClient = embeddingClient;
    this.config = runtimeConfig;
  }

  async ingestFile(filePath, projectRoot) {
    const absolutePath = path.resolve(projectRoot, filePath);
    const content = await fs.readFile(absolutePath, 'utf8');
    const checksum = createChecksum(content);
    const existing = await this.db.query(
      `
        SELECT 1
        FROM rag_chunks
        WHERE source_path = $1 AND checksum = $2
        LIMIT 1
      `,
      [filePath, checksum]
    );

    if (existing.rowCount > 0) {
      return { chunksProcessed: 0, skipped: true, checksum };
    }

    await this.db.query(
      `
        DELETE FROM rag_chunks
        WHERE source_path = $1
      `,
      [filePath]
    );

    const chunks = chunkText(content);

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = await this.embeddingClient.embedText(chunk);
      const encryptedContent = encrypt(chunk);
      const metadata = {
        sourcePath: filePath,
        absolutePath,
        checksum,
        chunkIndex: i,
        chunkLength: chunk.length,
        embeddingProvider: embedding.provider,
        embeddingModel: embedding.model,
      };

      await this.db.query(
        `
          INSERT INTO rag_chunks (source_path, checksum, chunk_index, content, metadata, embedding)
          VALUES ($1, $2, $3, $4, $5::jsonb, $6::double precision[])
        `,
        [filePath, checksum, i, encryptedContent, JSON.stringify(metadata), embedding.vector]
      );
    }

    return {
      chunksProcessed: chunks.length,
      skipped: false,
      checksum,
    };
  }
}
