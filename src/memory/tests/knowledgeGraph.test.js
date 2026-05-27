import { addNode, addEdge, getDependencies } from '../knowledgeGraph.js';
import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import { config } from '../../config.js';
import path from 'node:path';

async function testKnowledgeGraph() {
  const graphPath = path.join(config.workspaceRoot, 'memory', 'graph.json');
  await fs.mkdir(path.dirname(graphPath), { recursive: true });

  // 1. Test Node/Edge creation
  await addNode('task-1', 'task');
  await addNode('task-2', 'task');
  await addEdge('task-1', 'task-2', 'dependsOn');

  // 2. Test Dependency Query
  const deps = await getDependencies('task-2');
  assert.deepStrictEqual(deps, ['task-1'], 'Dependency mapping failed');

  console.log('KnowledgeGraph tests passed!');
  
  // Cleanup
  await fs.rm(path.join(config.workspaceRoot, 'memory'), { recursive: true, force: true });
}

testKnowledgeGraph().catch((err) => {
  console.error(err);
  process.exit(1);
});
