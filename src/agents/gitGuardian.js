import { runTool } from '../tools/registry.js';
import { config } from '../config.js';

export async function verifyAndCommit(path, taskId) {
  // 1. Verify syntax/lint
  try {
    await runTool('run_terminal_command', { command: `node --check "${path}"` }, config.workspaceRoot);
  } catch (error) {
    await runTool('run_terminal_command', { command: `git checkout "$(basename "${path}")"` }, config.workspaceRoot);
    throw new Error(`Syntax check failed for ${path}. Changes reverted.`);
    }

    // 3. Commit if passed (check if there are changes first)
    const status = await runTool('run_terminal_command', { command: `git status --porcelain "$(basename "${path}")"` }, config.workspaceRoot);
    if (status.output.trim() !== '') {
    await runTool('run_terminal_command', { 
      command: `git add "${path}" && git commit -m "feat(arnold): task ${taskId} update $(basename "${path}")"` 
    }, config.workspaceRoot);
    }

  
  return { status: 'success' };
}
