import { routeFileEdit } from '../fileEditRouter.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { strict as assert } from 'node:assert';

async function testFileEditRouter() {
  const testDir = './test-workspace';
  const testFile = path.join(testDir, 'test.txt');

  await fs.mkdir(testDir, { recursive: true });

  // 1. Test Write (File doesn't exist)
  const action1 = await routeFileEdit(testFile);
  assert.strictEqual(action1, 'write', 'Expected "write" for non-existent file');

  // 2. Test Patch (File exists)
  await fs.writeFile(testFile, 'hello');
  const action2 = await routeFileEdit(testFile);
  assert.strictEqual(action2, 'patch', 'Expected "patch" for existing file');

  await fs.rm(testDir, { recursive: true, force: true });
  console.log('FileEditRouter tests passed!');
}

testFileEditRouter().catch((err) => {
  console.error(err);
  process.exit(1);
});
