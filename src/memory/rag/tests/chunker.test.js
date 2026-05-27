import { chunkText } from '../chunker.js';
import { strict as assert } from 'node:assert';

async function testChunker() {
  const longText = "Para 1\n\nPara 2\n\nPara 3";
  const chunks = chunkText(longText, 10);
  
  assert.ok(chunks.length >= 2, 'Should have at least 2 chunks for small maxChars');
  assert.ok(chunks[0].includes('Para 1'), 'First chunk missing content');
  
  console.log('RAG Chunker tests passed!');
}

testChunker().catch((err) => {
  console.error(err);
  process.exit(1);
});
