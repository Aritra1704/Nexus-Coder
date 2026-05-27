import { patch } from '../filePatcher.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { strict as assert } from 'node:assert';

async function testFilePatcher() {
  const testDir = '/Users/aritrarpal/Documents/workspace_biz/Arnold/workspace/test-workspace';
  const testFile = path.join(testDir, 'test.txt');

  await fs.mkdir(testDir, { recursive: true });
  await fs.writeFile(testFile, 'hello world');

  // 1. Test Valid Patch
  await patch(testFile, 'hello', 'hi');
  const content = await fs.readFile(testFile, 'utf8');
  assert.strictEqual(content, 'hi world', 'Patch failed to update content');

  // 2. Test Invalid Patch
  try {
    await patch(testFile, 'non-existent', 'fail');
    assert.fail('Should have thrown an error for missing content');
  } catch (err) {
    assert.ok(err.message.includes('Failed to find exact block'), 'Incorrect error message');
  }

  await fs.rm(testDir, { recursive: true, force: true });
  console.log('FilePatcher tests passed!');
}

testFilePatcher().catch((err) => {
  console.error(err);
  process.exit(1);
});
