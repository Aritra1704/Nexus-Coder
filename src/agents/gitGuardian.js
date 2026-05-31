import fs from 'node:fs/promises';
import nodePath from 'node:path';
import { runTool } from '../tools/registry.js';
import { config } from '../config.js';

async function fileExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function findNearestFile(startDir, fileName) {
  let currentDir = startDir;

  while (true) {
    const candidate = nodePath.join(currentDir, fileName);
    if (await fileExists(candidate)) {
      return candidate;
    }

    const parentDir = nodePath.dirname(currentDir);
    if (parentDir === currentDir) {
      return null;
    }
    currentDir = parentDir;
  }
}

function getErrorDetail(error) {
  if (!error) {
    return 'Unknown verification failure';
  }

  if (typeof error.stderr === 'string' && error.stderr.trim()) {
    return error.stderr.trim();
  }

  if (typeof error.stdout === 'string' && error.stdout.trim()) {
    return error.stdout.trim();
  }

  return error.message ?? String(error);
}

async function resolveRepoRoot(fileDir) {
  const result = await runTool(
    'run_terminal_command',
    { command: `git -C "${fileDir}" rev-parse --show-toplevel` },
    config.workspaceRoot
  );

  return result.output.trim();
}

async function buildVerificationCommand(filePath) {
  const extension = nodePath.extname(filePath).toLowerCase();
  const fileDir = nodePath.dirname(filePath);

  if (extension === '.java') {
    const pomPath = await findNearestFile(fileDir, 'pom.xml');
    if (!pomPath) {
      throw new Error(`No pom.xml found for Java verification: ${filePath}`);
    }
    return `mvn -f "${pomPath}" compile`;
  }

  if (extension === '.ts') {
    const tsconfigPath = await findNearestFile(fileDir, 'tsconfig.json');
    if (tsconfigPath) {
      return `tsc --pretty false --noEmit --project "${tsconfigPath}"`;
    }
    return `tsc --pretty false --noEmit "${filePath}"`;
  }

  if (extension === '.js') {
    return `node --check "${filePath}"`;
  }

  throw new Error(`Unsupported file type for verification: ${extension || 'no extension'}`);
}

async function revertFile(repoRoot, relativePath) {
  await runTool(
    'run_terminal_command',
    { command: `git -C "${repoRoot}" checkout -- "${relativePath}"` },
    config.workspaceRoot
  );
}

export async function verifyAndCommit(path, taskId) {
  const filePath = nodePath.resolve(path);
  const fileDir = nodePath.dirname(filePath);
  const repoRoot = await resolveRepoRoot(fileDir);
  const relativePath = nodePath.relative(repoRoot, filePath);

  try {
    const verifyCommand = await buildVerificationCommand(filePath);
    await runTool('run_terminal_command', { command: verifyCommand }, config.workspaceRoot);
  } catch (error) {
    await revertFile(repoRoot, relativePath);
    throw new Error(`Verification failed for ${filePath}. Changes reverted. Arnold report: ${getErrorDetail(error)}`);
  }

  const status = await runTool(
    'run_terminal_command',
    { command: `git -C "${repoRoot}" status --porcelain -- "${relativePath}"` },
    config.workspaceRoot
  );

  if (status.output.trim() !== '') {
    await runTool(
      'run_terminal_command',
      {
        command: `git -C "${repoRoot}" add -- "${relativePath}" && git -C "${repoRoot}" commit -m "feat(surgical-orchestrator): task ${taskId} update ${nodePath.basename(filePath)}"`,
      },
      config.workspaceRoot
    );
  }

  return { status: 'success' };
}
