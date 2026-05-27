import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../config.js';

export async function pruneArtifacts(maxAgeDays) {
  const artifactDir = path.join(config.workspaceRoot, 'memory', 'artifacts');
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

  try {
    const files = await fs.readdir(artifactDir);
    for (const file of files) {
      const filePath = path.join(artifactDir, file);
      const stats = await fs.stat(filePath);
      if (now - stats.mtimeMs > maxAgeMs) {
        await fs.rm(filePath);
      }
    }
  } catch (err) {
    // Artifact dir might not exist yet
  }
}
