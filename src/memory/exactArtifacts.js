import { runTool } from '../tools/registry.js';
import { config } from '../config.js';
import path from 'node:path';

// Artifacts are stored as JSON files in workspace/memory/artifacts/
const ARTIFACT_DIR = path.join('memory', 'artifacts');

export async function saveArtifact(taskId, artifactType, data) {
  const artifactPath = path.join(ARTIFACT_DIR, `${taskId}_${artifactType}.json`);
  await runTool('make_dir', { path: ARTIFACT_DIR }, config.workspaceRoot);
  await runTool('write_file', { path: artifactPath, content: JSON.stringify(data, null, 2) }, config.workspaceRoot);
  return artifactPath;
}

export async function getArtifact(taskId, artifactType) {
  const artifactPath = path.join(ARTIFACT_DIR, `${taskId}_${artifactType}.json`);
  const result = await runTool('read_file', { path: artifactPath }, config.workspaceRoot);
  return JSON.parse(result.content);
}
