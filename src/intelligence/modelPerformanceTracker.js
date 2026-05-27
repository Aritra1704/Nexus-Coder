import { runTool } from '../tools/registry.js';
import { config } from '../config.js';

export async function logTaskResult(taskType, model, success, tokens, duration) {
  // Simple file-based tracking for the foundation, to be upgraded to DB in Stage 5
  const logPath = 'db/performance.log';
  const entry = JSON.stringify({ taskType, model, success, tokens, duration, timestamp: Date.now() });
  await runTool('append_file', { path: logPath, content: entry + '\n' }, config.workspaceRoot);
}

export async function getBestModel(taskType) {
  // Simplified logic for now
  if (taskType === 'planning') return config.modelPlanner;
  if (taskType === 'coding') return config.modelCoder;
  return config.modelFast;
}
