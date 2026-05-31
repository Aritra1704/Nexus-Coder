import { patch } from '../filePatcher.js';
import { runTool } from '../../tools/registry.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { strict as assert } from 'node:assert';

const testDir = '/Users/aritrarpal/Documents/workspace_biz/surgical-orchestrator/workspace/test-workspace';
const originalFetch = global.fetch;

async function withMockedFetch(handler, callback) {
  global.fetch = handler;
  try {
    await callback();
  } finally {
    global.fetch = originalFetch;
  }
}

async function testFilePatcherUsesOllamaReplacePayload() {
  const testFile = path.join(testDir, 'test.txt');
  await fs.mkdir(testDir, { recursive: true });
  await fs.writeFile(testFile, 'hello world');

  await withMockedFetch(async (url, options) => {
    assert.match(url, /\/api\/chat$/, 'Expected Ollama chat endpoint');

    const body = JSON.parse(options.body);
    assert.strictEqual(body.model, 'qwen2.5-coder:7b');
    assert.ok(body.messages[1].content.includes('Objective: Replace hello with hi'));
    assert.ok(body.messages[1].content.includes('hello world'));

    return {
      ok: true,
      async json() {
        return {
          message: {
            content: JSON.stringify({
              oldContent: 'hello',
              newContent: 'hi',
            }),
          },
        };
      },
    };
  }, async () => {
    await patch(testFile, 'Replace hello with hi');
  });

  const content = await fs.readFile(testFile, 'utf8');
  assert.strictEqual(content, 'hi world', 'Patch failed to update content from Ollama response');
}

async function testRegistrySurgicalFileEditTool() {
  const testFile = path.join(testDir, 'registry.txt');
  await fs.writeFile(testFile, 'const count = 1;\n');

  await withMockedFetch(async () => ({
    ok: true,
    async json() {
      return {
        message: {
          content: JSON.stringify({
            oldContent: 'const count = 1;',
            newContent: 'const count = 2;',
          }),
        },
      };
    },
  }), async () => {
    const result = await runTool(
      'surgical_file_edit',
      {
        path: 'registry.txt',
        objective: 'Increment the count constant from 1 to 2.',
      },
      testDir
    );

    assert.deepStrictEqual(result, { status: 'success', path: 'registry.txt' });
  });

  const content = await fs.readFile(testFile, 'utf8');
  assert.strictEqual(content, 'const count = 2;\n', 'Registry surgical edit did not update the file');
}

async function testFilePatcherRejectsInvalidModelPayload() {
  const testFile = path.join(testDir, 'invalid.txt');
  await fs.writeFile(testFile, 'hello world');

  await withMockedFetch(async () => ({
    ok: true,
    async json() {
      return {
        message: {
          content: '{"newContent":"hi"}',
        },
      };
    },
  }), async () => {
    await assert.rejects(
      patch(testFile, 'Replace hello with hi'),
      /oldContent/
    );
  });
}

async function testFilePatcher() {
  await fs.rm(testDir, { recursive: true, force: true });
  await fs.mkdir(testDir, { recursive: true });

  await testFilePatcherUsesOllamaReplacePayload();
  await testRegistrySurgicalFileEditTool();
  await testFilePatcherRejectsInvalidModelPayload();

  await fs.rm(testDir, { recursive: true, force: true });
  console.log('FilePatcher tests passed!');
}

testFilePatcher().catch((err) => {
  console.error(err);
  process.exit(1);
});
