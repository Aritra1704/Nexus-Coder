import { runTerminalCommand, createProjectRepo } from '../manager.js';
import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';

async function testSandbox() {
  const testParentDir = '/Users/aritrarpal/Documents/workspace_biz/surgical-orchestrator/workspace/sandbox-tests';
  await fs.mkdir(testParentDir, { recursive: true });

  // 1. Test Project Creation
  const projectPath = await createProjectRepo('test-repo', testParentDir);
  const gitDir = path.join(projectPath, '.git');
  await fs.access(gitDir);
  console.log('Project Repo Creation passed!');

  // 2. Test In-Place Command Execution
  const testFile = 'test.txt';
  await runTerminalCommand({
    command: `echo "surgical-orchestrator was here" > ${testFile}`,
    workspaceRoot: projectPath
  });

  const content = await fs.readFile(path.join(projectPath, testFile), 'utf8');
  assert.strictEqual(content.trim(), 'surgical-orchestrator was here', 'File content mismatch in sandbox');
  console.log('In-Place Command Execution passed!');

  // 3. Test Safeguard
  try {
    await runTerminalCommand({ command: 'rm -rf /', workspaceRoot: projectPath });
    assert.fail('Blocked command should have thrown');
  } catch (err) {
    assert.ok(err.message.includes('Safeguard blocklist'), 'Incorrect error for blocked command');
  }
  console.log('Sandbox Safeguard passed!');

  // Cleanup
  await fs.rm(testParentDir, { recursive: true, force: true });
}

testSandbox().catch((err) => {
  console.error(err);
  process.exit(1);
});
