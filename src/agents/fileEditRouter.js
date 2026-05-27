import fs from 'node:fs/promises';

/**
 * FileEditRouter
 * Decides whether to 'write' (create new) or 'patch' (modify existing) a file.
 */
export async function routeFileEdit(path) {
  try {
    await fs.access(path);
    return 'patch';
  } catch {
    return 'write';
  }
}
