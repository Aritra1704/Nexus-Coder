import { getPool } from '../db/client.js';
import { config } from '../config.js';

export async function logTaskResult(taskType, model, success, tokens, duration) {
  await getPool().query(
    `
      INSERT INTO model_performance (model_name, task_type, success, tokens_used, duration_ms)
      VALUES ($1, $2, $3, $4, $5)
    `,
    [model, taskType, success, tokens, duration]
  );
}

export async function getBestModel(taskType) {
  // Simplified logic for now
  if (taskType === 'planning') return config.modelPlanner;
  if (taskType === 'coding') return config.modelCoder;
  return config.modelFast;
}
