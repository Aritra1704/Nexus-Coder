import { GeminiDriver } from '../src/brain/geminiDriver.js';
import { runTool } from '../src/tools/registry.js';
import { config } from '../src/config.js';
import { verifyAndCommit } from '../src/agents/gitGuardian.js';
import { routeFileEdit } from '../src/agents/fileEditRouter.js';
import { write } from '../src/agents/fileWriter.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { strict as assert } from 'node:assert';

/**
 * surgical-orchestrator Hello World Integration Test
 * This script bypasses the LLM 'decide' step to verify the 
 * mechanical orchestration logic: Router -> Writer -> Guardian.
 */
async function runHelloWorld() {
  console.log('🚀 Starting surgical-orchestrator Hello World Integration Test...');

  const workspaceRoot = config.workspaceRoot;
  const testFile = 'hello.js';
  const fullPath = path.join(workspaceRoot, testFile);
  const taskId = 'hello-101';

  // 0. Ensure workspace is a git repo for GitGuardian
  await fs.mkdir(workspaceRoot, { recursive: true });
  try {
    await runTool('run_terminal_command', { command: 'git init && git config user.email "surgical-orchestrator@test.com" && git config user.name "surgical-orchestrator"' }, workspaceRoot);
  } catch (e) { /* ignore if already init */ }

  // 1. Decision Phase (Simulated)
  console.log('1. Deciding action for:', testFile);
  const action = await routeFileEdit(fullPath);
  assert.strictEqual(action, 'write', 'Should decide to WRITE a new file');

  // 2. Execution Phase
  console.log('2. Executing Write...');
  const content = 'console.log("Hello from surgical-orchestrator!");\n';
  await write(testFile, content);

  // 3. Verification Phase (GitGuardian)
  console.log('3. Verifying and Committing...');
  await verifyAndCommit(testFile, taskId);

  // 4. Final Validation
  const savedContent = await fs.readFile(fullPath, 'utf8');
  assert.strictEqual(savedContent, content, 'File content mismatch');
  
  const gitLog = await runTool('run_terminal_command', { command: 'git log -1 --pretty=%s' }, workspaceRoot);
  assert.ok(gitLog.output.includes(taskId), 'Git commit message missing Task ID');

  console.log('✅ surgical-orchestrator Hello World Test PASSED!');
  console.log('Summary: Action Routed -> File Written -> Syntax Verified -> Git Committed.');
}

runHelloWorld().catch(err => {
  console.error('❌ Integration Test FAILED:', err);
  process.exit(1);
});
