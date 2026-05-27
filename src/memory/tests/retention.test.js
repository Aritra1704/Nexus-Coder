import { pruneArtifacts } from '../retention.js';
import { strict as assert } from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from '../../config.js';

async function testRetention() {
  const artifactDir = path.join(config.workspaceRoot, 'memory', 'artifacts');
  await fs.mkdir(artifactDir, { recursive: true });

  const oldFile = path.join(artifactDir, 'old.json');
  const newFile = path.join(artifactDir, 'new.json');
  
  await fs.writeFile(oldFile, '{}');
  await fs.writeFile(newFile, '{}');

  // Manually set mtime to 10 days ago for the old file
  const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  await fs.utimes(oldFile, tenDaysAgo, tenDaysAgo);

  // Prune files older than 5 days
  await pruneArtifacts(5);

  // Verify
  const files = await fs.readdir(artifactDir);
  assert.ok(!files.includes('old.json'), 'Old file should have been pruned');
  assert.ok(files.includes('new.json'), 'New file should have been kept');

  console.log('Retention tests passed!');
  
  // Cleanup
  await fs.rm(path.join(config.workspaceRoot, 'memory'), { recursive: true, force: true });
}

testRetention().catch((err) => {
  console.error(err);
  process.exit(1);
});
