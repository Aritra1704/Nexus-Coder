import { logTaskResult, getBestModel } from '../modelPerformanceTracker.js';
import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config.js';

async function testPerformanceTracker() {
  const logPath = path.join(config.workspaceRoot, 'db/performance.log');
  await fs.mkdir(path.dirname(logPath), { recursive: true });

  // 1. Test logging
  await logTaskResult('coding', 'qwen2.5-coder:7b', true, 100, 500);
  const logContent = await fs.readFile(logPath, 'utf8');
  assert.ok(logContent.includes('coding'), 'Log entry not found');

  // 2. Test Model Recommendation
  const model = await getBestModel('planning');
  assert.strictEqual(model, 'gemini-2.5-pro', 'Incorrect model for planning');

  console.log('ModelPerformanceTracker tests passed!');
  await fs.rm(path.dirname(logPath), { recursive: true, force: true });
}

testPerformanceTracker().catch((err) => {
  console.error(err);
  process.exit(1);
});
