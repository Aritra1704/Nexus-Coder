import { strict as assert } from 'node:assert';

process.env.GEMINI_API_KEY = 'test-key';

const { GeminiDriver } = await import('../geminiDriver.js');

async function testLoadStateIncludesRelevantContext() {
  const driver = new GeminiDriver(
    {
      async runTool() {
        throw new Error('runTool should not be called during loadState');
      },
    },
    {
      retriever: {
        async retrieve(query, topK) {
          assert.strictEqual(query, 'Refactor the retriever integration');
          assert.strictEqual(topK, 3);
          return [
            {
              sourcePath: 'src/memory/rag/retriever.js',
              chunkIndex: 2,
              similarity: 0.9234,
              content: 'The retriever decrypts top-ranked chunks before returning them.',
            },
          ];
        },
      },
    }
  );

  const state = await driver.loadState({
    id: 'task-42',
    objective: 'Refactor the retriever integration',
  });

  assert.strictEqual(state.messages[0].role, 'system');
  assert.strictEqual(state.messages[1].role, 'user');
  assert.ok(state.messages[1].content.includes('Relevant Project Context:'), 'User bootstrap message should include RAG context');
  assert.ok(state.messages[1].content.includes('src/memory/rag/retriever.js'), 'Context should include the source path');
  assert.ok(state.messages[1].content.includes('score 0.923'), 'Context should include a rounded similarity score');
  assert.ok(state.messages[1].content.includes('decrypts top-ranked chunks'), 'Context should include decrypted chunk content');

  console.log('GeminiDriver loadState tests passed!');
}

async function testRunLoopBroadcastsLifecycleUpdates() {
  const updates = [];
  const driver = new GeminiDriver(
    {
      async runTool() {
        throw new Error('runTool should not be called for a final-only decision');
      },
    },
    {
      retriever: {
        async retrieve() {
          return [];
        },
      },
      telegramBot: {
        async broadcastTaskUpdate(taskId, message) {
          updates.push({ taskId, message });
        },
      },
    }
  );

  driver.decide = async () => ({
    type: 'final',
    summary: 'Task completed cleanly.',
  });
  driver.persistReasoning = async () => {};
  driver.saveCheckpoint = async () => {};

  const state = await driver.runLoop({
    id: 'task-99',
    objective: 'Ship the Telegram integration',
  });

  assert.strictEqual(state.isDone, true, 'runLoop should complete on a final decision');
  assert.strictEqual(updates.length, 2, 'runLoop should broadcast start and finish updates');
  assert.deepStrictEqual(updates[0], {
    taskId: 'task-99',
    message: 'Started: Ship the Telegram integration',
  });
  assert.deepStrictEqual(updates[1], {
    taskId: 'task-99',
    message: 'Final Summary:\nTask completed cleanly.',
  });

  console.log('GeminiDriver runLoop notification tests passed!');
}

async function run() {
  await testLoadStateIncludesRelevantContext();
  await testRunLoopBroadcastsLifecycleUpdates();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
