import { runTool } from '../tools/registry.js';
import { config } from '../config.js';

export async function patch(path, oldContent, newContent) {
  return await runTool('replace', { path, oldContent, newContent }, config.workspaceRoot);
}
