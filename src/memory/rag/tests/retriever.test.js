import { strict as assert } from 'node:assert';

process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

const { encrypt } = await import('../../../utils/crypto.js');
const { Retriever } = await import('../retriever.js');

async function testRetriever() {
  const fakeDb = {
    async query(sql) {
      assert.ok(sql.includes('FROM rag_chunks'), 'Retriever should read from rag_chunks');

      return {
        rows: [
          {
            id: 1,
            source_path: 'docs/a.md',
            checksum: 'aaa',
            chunk_index: 0,
            content: encrypt('Alpha implementation details'),
            metadata: { sourcePath: 'docs/a.md', kind: 'doc' },
            embedding: [1, 0],
          },
          {
            id: 2,
            source_path: 'docs/b.md',
            checksum: 'bbb',
            chunk_index: 1,
            content: encrypt('Beta implementation details'),
            metadata: JSON.stringify({ sourcePath: 'docs/b.md', kind: 'doc' }),
            embedding: [0.5, 0.5],
          },
          {
            id: 3,
            source_path: 'docs/c.md',
            checksum: 'ccc',
            chunk_index: 2,
            content: encrypt('Gamma implementation details'),
            metadata: { sourcePath: 'docs/c.md', kind: 'doc' },
            embedding: [0, 1],
          },
        ],
      };
    },
  };

  const fakeEmbeddingClient = {
    async embedText(text) {
      assert.strictEqual(text, 'alpha query', 'Retriever should embed the raw query text');
      return {
        provider: 'ollama',
        model: 'nomic-embed-text',
        vector: [1, 0],
      };
    },
  };

  const retriever = new Retriever(fakeDb, fakeEmbeddingClient);
  const matches = await retriever.retrieve('alpha query', 2);

  assert.strictEqual(matches.length, 2, 'Retriever should respect topK');
  assert.strictEqual(matches[0].sourcePath, 'docs/a.md', 'Best cosine match should rank first');
  assert.strictEqual(matches[0].content, 'Alpha implementation details', 'Top match content should be decrypted');
  assert.strictEqual(matches[1].sourcePath, 'docs/b.md', 'Second-best cosine match should rank second');
  assert.ok(matches[0].similarity > matches[1].similarity, 'Matches should be sorted by similarity descending');
  assert.deepStrictEqual(matches[1].metadata, { sourcePath: 'docs/b.md', kind: 'doc' }, 'JSON metadata should be normalized');

  const emptyMatches = await retriever.retrieve('   ', 3);
  assert.deepStrictEqual(emptyMatches, [], 'Blank queries should not hit retrieval');

  console.log('RAG Retriever tests passed!');
}

testRetriever().catch((err) => {
  console.error(err);
  process.exit(1);
});
