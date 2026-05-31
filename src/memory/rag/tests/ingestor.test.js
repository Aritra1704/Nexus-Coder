import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { strict as assert } from 'node:assert';

process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

const { decrypt } = await import('../../../utils/crypto.js');
const { Ingestor } = await import('../ingestor.js');

async function testIngestor() {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rag-ingestor-'));
  const filePath = 'sample.txt';
  const absoluteFilePath = path.join(tempDir, filePath);
  const fileContent = 'Alpha sentence. Beta sentence.\n\nGamma paragraph.';

  await fs.writeFile(absoluteFilePath, fileContent, 'utf8');

  const calls = [];
  const fakeDb = {
    async query(sql, params) {
      calls.push({ sql, params });

      if (sql.includes('SELECT 1')) {
        return { rowCount: 0, rows: [] };
      }

      if (sql.includes('DELETE FROM rag_chunks')) {
        return { rowCount: 0, rows: [] };
      }

      if (sql.includes('INSERT INTO rag_chunks')) {
        return { rowCount: 1, rows: [] };
      }

      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  const fakeEmbeddingClient = {
    async embedText(text) {
      return {
        provider: 'ollama',
        model: 'nomic-embed-text',
        vector: [text.length, 1, 2],
      };
    },
  };

  const ingestor = new Ingestor(fakeDb, fakeEmbeddingClient);
  const result = await ingestor.ingestFile(filePath, tempDir);

  assert.ok(result.chunksProcessed >= 1, 'Should process at least one chunk');

  const insertCalls = calls.filter((call) => call.sql.includes('INSERT INTO rag_chunks'));
  assert.strictEqual(insertCalls.length, result.chunksProcessed, 'Should insert one row per chunk');

  for (const call of insertCalls) {
    const encryptedContent = call.params[3];
    const metadata = JSON.parse(call.params[4]);
    const vector = call.params[5];

    assert.notStrictEqual(encryptedContent, fileContent, 'Chunk content should be encrypted');
    assert.ok(typeof decrypt(encryptedContent) === 'string', 'Encrypted chunk should be decryptable');
    assert.strictEqual(metadata.sourcePath, filePath, 'Metadata should include the source path');
    assert.ok(Array.isArray(vector), 'Embedding vector should be stored as an array');
  }

  await fs.rm(tempDir, { recursive: true, force: true });
  console.log('RAG Ingestor tests passed!');
}

testIngestor().catch((err) => {
  console.error(err);
  process.exit(1);
});
