import { chunkText } from '../chunker.js';
import { strict as assert } from 'node:assert';

async function testChunker() {
  const longText = [
    'Paragraph one has two sentences. It should stay together when there is room.',
    'Paragraph two is intentionally longer. It has several sentences. The chunker should prefer sentence boundaries over arbitrary cuts.',
    'A'.repeat(45),
  ].join('\n\n');
  const chunks = chunkText(longText, 80);

  assert.ok(chunks.length >= 3, 'Should create multiple chunks for constrained maxChars');
  assert.ok(chunks[0].includes('Paragraph one'), 'First chunk missing content');
  assert.ok(chunks.every((chunk) => chunk.length <= 80), 'Chunks should not exceed maxChars');
  assert.ok(chunks.some((chunk) => chunk.includes('Paragraph two is intentionally longer.')), 'Should preserve sentence boundaries');
  assert.ok(chunks.some((chunk) => chunk.includes('AAAAAAAAAA')), 'Should still chunk oversized text');

  console.log('RAG Chunker tests passed!');
}

testChunker().catch((err) => {
  console.error(err);
  process.exit(1);
});
