import { runTool } from '../tools/registry.js';
import { config } from '../config.js';
import path from 'node:path';

const GRAPH_PATH = path.join('memory', 'graph.json');

let graph = { nodes: {}, edges: [] };

async function loadGraph() {
  try {
    const result = await runTool('read_file', { path: GRAPH_PATH }, config.workspaceRoot);
    graph = JSON.parse(result.content);
  } catch {
    graph = { nodes: {}, edges: [] };
  }
}

async function saveGraph() {
  await runTool('write_file', { path: GRAPH_PATH, content: JSON.stringify(graph, null, 2) }, config.workspaceRoot);
}

export async function addNode(id, type, metadata = {}) {
  await loadGraph();
  graph.nodes[id] = { type, metadata };
  await saveGraph();
}

export async function addEdge(from, to, relation) {
  await loadGraph();
  graph.edges.push({ from, to, relation });
  await saveGraph();
}

export async function getDependencies(nodeId) {
  await loadGraph();
  return graph.edges.filter(edge => edge.to === nodeId).map(edge => edge.from);
}
