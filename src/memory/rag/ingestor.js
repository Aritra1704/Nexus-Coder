import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chunkText } from './chunker.js';

function createChecksum(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export class Ingestor {
  constructor(db, embeddingClient, config) {
    this.db = db;
    this.embeddingClient = embeddingClient;
    this.config = config;
  }

  async ingestFile(filePath, projectRoot) {
    const absolutePath = path.resolve(projectRoot, filePath);
    const content = await fs.readFile(absolutePath, 'utf8');
    const checksum = createChecksum(content);
    
    // Check if unchanged
    // Logic to be implemented with DB in Stage 5
    
    const chunks = chunkText(content);
    for (let i = 0; i < chunks.length; i++) {
      // 1. Generate Embedding
      // 2. Store Chunk + Embedding in DB
    }
    
    return { chunksProcessed: chunks.length };
  }
}
