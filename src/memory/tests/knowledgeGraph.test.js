import { addNode, addEdge, getDependencies } from '../knowledgeGraph.js';
import { strict as assert } from 'node:assert';
import { closePool, getPool } from '../../db/client.js';

async function testKnowledgeGraph() {
  try {
    const pool = getPool();
    const sourceNode = `task-1-${Date.now()}`;
    const targetNode = `task-2-${Date.now()}`;

    await addNode(sourceNode, 'task');
    await addNode(targetNode, 'task');
    await addEdge(sourceNode, targetNode, 'dependsOn');

    const deps = await getDependencies(targetNode);
    assert.deepStrictEqual(deps, [sourceNode], 'Dependency mapping failed');

    await pool.query('DELETE FROM graph_nodes WHERE id = ANY($1::text[])', [[sourceNode, targetNode]]);
    console.log('KnowledgeGraph tests passed!');
  } catch (err) {
    console.error('KnowledgeGraph test FAILED:', err.message);
  } finally {
    await closePool();
  }
}

testKnowledgeGraph();
