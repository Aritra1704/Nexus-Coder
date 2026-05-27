import { saveArtifact, getArtifact } from '../exactArtifacts.js';
import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import { config } from '../../config.js';
import path from 'node:path';

async function testExactArtifacts() {
  const taskId = 'test-task-1';
  const artifactType = 'test-artifact';
  const data = { foo: 'bar' };

  // 1. Test Save
  await saveArtifact(taskId, artifactType, data);
  
  // 2. Test Get
  const retrieved = await getArtifact(taskId, artifactType);
  assert.deepStrictEqual(retrieved, data, 'Artifact retrieval mismatch');

  console.log('ExactArtifacts tests passed!');
  
  // Cleanup
  await fs.rm(path.join(config.workspaceRoot, 'memory'), { recursive: true, force: true });
}

testExactArtifacts().catch((err) => {
  console.error(err);
  process.exit(1);
});
