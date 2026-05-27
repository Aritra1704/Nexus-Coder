import { verifyAndCommit } from '../gitGuardian.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { strict as assert } from 'node:assert';
import { runTool } from '../../tools/registry.js';
import { config } from '../../config.js';

async function testGitGuardian() {
  const testDir = '/Users/aritrarpal/Documents/workspace_biz/Arnold/workspace/test-workspace';
  const testFile = path.join(testDir, 'test.js');

  await fs.mkdir(testDir, { recursive: true });
  await runTool('run_terminal_command', { command: 'git init' }, testDir); // Initialize git in test dir
  await fs.writeFile(testFile, 'console.log("hello")');
  await runTool('run_terminal_command', { command: 'git add . && git commit -m "initial"' }, testDir);

  // 1. Test Success
  await fs.writeFile(testFile, 'console.log("updated")');
  await verifyAndCommit(testFile, 'task-1');
  console.log('GitGuardian Success branch passed!');

  // 2. Test Failure
  await fs.writeFile(testFile, 'invalid syntax {');
  try {
    await verifyAndCommit(testFile, 'task-2');
    assert.fail('Should have failed syntax check');
  } catch (err) {
    assert.ok(err.message.includes('Syntax check failed'), 'Incorrect error message');
    const content = await fs.readFile(testFile, 'utf8');
    assert.strictEqual(content, 'console.log("updated")', 'File not reverted');
  }
  console.log('GitGuardian Failure branch passed!');

  await fs.rm(testDir, { recursive: true, force: true });
}

testGitGuardian().catch((err) => {
  console.error(err);
  process.exit(1);
});
