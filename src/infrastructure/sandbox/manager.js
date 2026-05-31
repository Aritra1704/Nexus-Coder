import { exec } from 'node:child_process';
import util from 'node:util';
import { config } from '../../config.js';

const execAsync = util.promisify(exec);

export async function runTerminalCommand({ command, workspaceRoot, timeoutMs = 120000 }) {
  // 1. Guard against critical OS commands in Native mode
  const blockedCommands = ['rm -rf /', 'mkfs', 'dd if=', 'chmod -R 777 /'];
  if (blockedCommands.some(bad => command.includes(bad))) {
    throw new Error('CRITICAL ERROR: Command hit OS Safeguard blocklist.');
  }

  // 2. surgical-orchestrator Logic: Always ensure execution happens in the user's workspace_biz repos
  // We use the absolute path to workspaceRoot to ensure in-place editing.
  
  if (config.dockerSandboxEnabled) {
    const dockerCmd = [
      'docker run --rm',
      `--memory="2g"`,
      `--cpus="2"`,
      `-v "${workspaceRoot}:/workspace"`,
      `-w /workspace`,
      `node:20-slim`,
      `bash -c ${JSON.stringify(command)}`
    ].join(' ');

    const { stdout, stderr } = await execAsync(dockerCmd, { timeout: timeoutMs });
    return {
      output: `${stdout}\n${stderr}`.trim(),
      isError: false,
    };
  }

  // Native execution fallback
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: workspaceRoot,
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024 * 15,
    });
    return {
      output: `${stdout}\n${stderr}`.trim(),
      isError: false,
    };
  } catch (err) {
    throw new Error(`Execution Failed: ${err.message}`);
  }
}

/**
 * Creates a new project directory under workspace_biz and initializes it.
 */
export async function createProjectRepo(projectName, parentDir) {
  const projectPath = `${parentDir}/${projectName}`;
  await execAsync(`mkdir -p "${projectPath}"`);
  await execAsync(`cd "${projectPath}" && git init`);
  return projectPath;
}
