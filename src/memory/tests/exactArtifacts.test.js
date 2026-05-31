import { saveArtifact, getArtifact } from '../exactArtifacts.js';
import { strict as assert } from 'node:assert';
import { closePool, getPool } from '../../db/client.js';

async function testExactArtifacts() {
  try {
    const pool = getPool();
    const taskId = `test-task-${Date.now()}`;
    const artifactType = 'test-artifact';
    const data = { foo: 'bar' };

    await pool.query(
      `
        INSERT INTO tasks (id, objective, status)
        VALUES ($1, $2, $3)
      `,
      [taskId, 'test objective', 'pending']
    );

    const artifactId = await saveArtifact(taskId, artifactType, data);

    const stored = await pool.query(
      `
        SELECT content
        FROM memory_artifacts
        WHERE id = $1
      `,
      [artifactId]
    );

    assert.strictEqual(stored.rowCount, 1, 'Stored artifact row not found');
    assert.notStrictEqual(
      stored.rows[0].content,
      JSON.stringify(data),
      'Artifact content should be encrypted at rest'
    );

    const retrieved = await getArtifact(taskId, artifactType);
    assert.deepStrictEqual(retrieved, data, 'Artifact retrieval mismatch');

    await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
    console.log('ExactArtifacts tests passed!');
  } catch (err) {
    console.error('ExactArtifacts test FAILED:', err.message);
  } finally {
    await closePool();
  }
}

testExactArtifacts();
