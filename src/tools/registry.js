import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

// Tool definitions for surgical-orchestrator
export const TOOL_DEFINITIONS = [
  {
    name: 'make_dir',
    description: 'Create a directory inside the workspace.',
    argsSchema: z.object({
      path: z.string().min(1),
    }),
  },
  {
    name: 'write_file',
    description: 'Create or overwrite a UTF-8 file inside the workspace.',
    argsSchema: z.object({
      path: z.string().min(1),
      content: z.string(),
    }),
  },
  {
    name: 'read_file',
    description: 'Read a file from the workspace.',
    argsSchema: z.object({
      path: z.string().min(1),
    }),
  },
  {
    name: 'replace',
    description: 'Surgical patch: Replace an exact string block in an existing file. Fails if oldContent is not found.',
    argsSchema: z.object({
      path: z.string().min(1),
      oldContent: z.string().min(1),
      newContent: z.string(),
    }),
  },
  {
    name: 'surgical_file_edit',
    description: 'Use Ollama to identify an exact code block replacement for a file objective, then apply it with the replace tool.',
    argsSchema: z.object({
      path: z.string().min(1),
      objective: z.string().min(1),
    }),
  },
  {
    name: 'append_file',
    description: 'Append UTF-8 content to an existing file.',
    argsSchema: z.object({
      path: z.string().min(1),
      content: z.string().min(1),
    }),
  },
  {
    name: 'run_terminal_command',
    description: 'Execute a bash command.',
    argsSchema: z.object({
      command: z.string().min(1),
    }),
  },
];

export const TOOL_NAMES = TOOL_DEFINITIONS.map((tool) => tool.name);

export async function runTool(name, args, workspaceRoot) {
  const absPath = (relPath) => path.resolve(workspaceRoot, relPath);

  switch (name) {
    case 'make_dir':
      await fs.mkdir(absPath(args.path), { recursive: true });
      return { status: 'success', path: args.path };

    case 'write_file':
      await fs.writeFile(absPath(args.path), args.content, 'utf8');
      return { status: 'success', path: args.path };

    case 'append_file':
      await fs.appendFile(absPath(args.path), args.content, 'utf8');
      return { status: 'success', path: args.path };

    case 'read_file':
      const content = await fs.readFile(absPath(args.path), 'utf8');
      return { status: 'success', content };

    case 'replace':
      const original = await fs.readFile(absPath(args.path), 'utf8');
      if (!original.includes(args.oldContent)) {
        throw new Error(`Failed to find exact block for replacement in ${args.path}`);
      }
      const patched = original.replace(args.oldContent, args.newContent);
      await fs.writeFile(absPath(args.path), patched, 'utf8');
      return { status: 'success', path: args.path };

    case 'surgical_file_edit': {
      const { patch } = await import('../agents/filePatcher.js');
      return await patch(args.path, args.objective, workspaceRoot);
    }

    case 'run_terminal_command':
      const { exec } = await import('node:child_process');
      const { promisify } = await import('node:util');
      const execAsync = promisify(exec);
      const { stdout, stderr } = await execAsync(args.command, { cwd: workspaceRoot });
      return { status: 'success', output: stdout || stderr };

    default:
      throw new Error(`Tool not implemented: ${name}`);
  }
}
