import { runTool } from '../tools/registry.js';
import { config } from '../config.js';

export async function write(path, content) {
  return await runTool('write_file', { path, content }, config.workspaceRoot);
}
