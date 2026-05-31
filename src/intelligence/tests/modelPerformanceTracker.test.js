import { logTaskResult, getBestModel } from '../modelPerformanceTracker.js';
import { strict as assert } from 'node:assert';
import { closePool, getPool } from '../../db/client.js';

async function testPerformanceTracker() {
  try {
    const pool = getPool();
    const marker = `test-model-${Date.now()}`;

    await logTaskResult('coding', marker, true, 100, 500);
    const result = await pool.query(
      `
        SELECT task_type, model_name, success, tokens_used, duration_ms
        FROM model_performance
        WHERE model_name = $1
        ORDER BY id DESC
        LIMIT 1
      `,
      [marker]
    );

    assert.strictEqual(result.rowCount, 1, 'Log entry not found');
    assert.strictEqual(result.rows[0].task_type, 'coding', 'Incorrect task type');
    assert.strictEqual(result.rows[0].success, true, 'Incorrect success value');
    assert.strictEqual(result.rows[0].tokens_used, 100, 'Incorrect token count');
    assert.strictEqual(result.rows[0].duration_ms, 500, 'Incorrect duration');

    const model = await getBestModel('planning');
    assert.strictEqual(model, 'gemini-2.5-pro', 'Incorrect model for planning');

    await pool.query('DELETE FROM model_performance WHERE model_name = $1', [marker]);
    console.log('ModelPerformanceTracker tests passed!');
  } catch (err) {
    console.error('ModelPerformanceTracker test FAILED:', err.message);
  } finally {
    await closePool();
  }
}

testPerformanceTracker();
