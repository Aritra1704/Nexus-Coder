import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { closePool, withClient } from './client.js';
import { config } from '../config.js';

const moduleFilename = fileURLToPath(import.meta.url);
const moduleDirname = path.dirname(moduleFilename);
const migrationsDir = path.resolve(moduleDirname, '..', '..', 'db', 'migrations');
const schemaName = config.databaseSchema;
const migrationsTableName = '_migrations';
const qualifiedMigrationsTable = `"${schemaName}"."${migrationsTableName}"`;
const advisoryLockKey = `${schemaName}.${migrationsTableName}`;

async function listMigrationFiles() {
  const entries = await readdir(migrationsDir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

async function ensureMigrationState(client) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${qualifiedMigrationsTable} (
      id BIGSERIAL PRIMARY KEY,
      filename TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function loadAppliedMigrations(client) {
  const result = await client.query(`SELECT filename FROM ${qualifiedMigrationsTable}`);
  return new Set(result.rows.map((row) => row.filename));
}

async function applyMigration(client, filename) {
  const migrationPath = path.join(migrationsDir, filename);
  const sql = await readFile(migrationPath, 'utf8');

  try {
    await client.query('BEGIN');

    if (sql.trim()) {
      await client.query(sql);
    }

    await client.query(
      `INSERT INTO ${qualifiedMigrationsTable} (filename) VALUES ($1)`,
      [filename]
    );

    await client.query('COMMIT');
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error(`Rollback failed after migration error in ${filename}:`, rollbackError);
    }

    console.error(`Migration failed for ${filename}:`, error);
    throw error;
  }
}

export async function migrate() {
  return withClient(async (client) => {
    await client.query('SELECT pg_advisory_lock(hashtext($1))', [advisoryLockKey]);

    try {
      await ensureMigrationState(client);

      const migrationFiles = await listMigrationFiles();
      const appliedMigrations = await loadAppliedMigrations(client);
      let appliedCount = 0;

      for (const filename of migrationFiles) {
        if (appliedMigrations.has(filename)) {
          continue;
        }

        await applyMigration(client, filename);
        appliedMigrations.add(filename);
        appliedCount += 1;
        console.log(`Applied migration ${filename}`);
      }

      return {
        appliedCount,
        totalMigrations: migrationFiles.length,
      };
    } finally {
      await client.query('SELECT pg_advisory_unlock(hashtext($1))', [advisoryLockKey]);
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === moduleFilename) {
  migrate()
    .then(({ appliedCount, totalMigrations }) => {
      console.log(
        `Migration run complete. Applied ${appliedCount} migration(s) from ${totalMigrations} file(s).`
      );
    })
    .catch((error) => {
      console.error('Migration run failed:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await closePool();
    });
}
