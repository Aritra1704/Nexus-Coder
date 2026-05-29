import crypto from 'node:crypto';

import express from 'express';

import { config } from '../config.js';
import { getPool } from '../db/client.js';
import { getPresenceStatus } from '../telegram/bot.js';

function normalizeTaskRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    objective: row.objective,
    status: row.status,
    payload: row.payload ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function extractApiKey(req) {
  const authHeader = req.get('authorization');

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  return req.get('x-api-key')?.trim() ?? null;
}

async function getTaskById(db, taskId) {
  const result = await db.query(
    `
      SELECT id, objective, status, payload, created_at, updated_at
      FROM tasks
      WHERE id = $1
      LIMIT 1
    `,
    [taskId]
  );

  return normalizeTaskRow(result.rows[0] ?? null);
}

async function listTasks(db) {
  const result = await db.query(
    `
      SELECT id, objective, status, payload, created_at, updated_at
      FROM tasks
      ORDER BY created_at DESC, updated_at DESC
    `
  );

  return result.rows.map(normalizeTaskRow);
}

async function insertTask(db, { id, objective, payload }) {
  const result = await db.query(
    `
      INSERT INTO tasks (id, objective, status, payload)
      VALUES ($1, $2, $3, $4::jsonb)
      RETURNING id, objective, status, payload, created_at, updated_at
    `,
    [id, objective, 'pending', JSON.stringify(payload ?? {})]
  );

  return normalizeTaskRow(result.rows[0]);
}

async function updateTask(db, taskId, { status, payload }) {
  const result = await db.query(
    `
      UPDATE tasks
      SET status = $2,
          payload = $3::jsonb,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, objective, status, payload, created_at, updated_at
    `,
    [taskId, status, JSON.stringify(payload ?? {})]
  );

  return normalizeTaskRow(result.rows[0] ?? null);
}

async function runTask(driver, db, taskRecord) {
  if (!driver?.runLoop || typeof driver.runLoop !== 'function') {
    return updateTask(db, taskRecord.id, {
      status: 'blocked',
      payload: {
        ...(taskRecord.payload ?? {}),
        error: 'Driver is not available to execute tasks.',
      },
    });
  }

  await updateTask(db, taskRecord.id, {
    status: 'in_progress',
    payload: taskRecord.payload ?? {},
  });

  try {
    const finalState = await driver.runLoop({
      ...taskRecord,
      payload: taskRecord.payload ?? {},
    });

    await updateTask(db, taskRecord.id, {
      status: 'done',
      payload: {
        ...(taskRecord.payload ?? {}),
        finalSummary: finalState?.finalSummary ?? null,
        completedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    await updateTask(db, taskRecord.id, {
      status: 'failed',
      payload: {
        ...(taskRecord.payload ?? {}),
        error: error instanceof Error ? error.message : String(error),
        failedAt: new Date().toISOString(),
      },
    });
  }
}

export function createControlAPI({
  driver = null,
  db = getPool(),
  apiToken = config.controlApiToken,
} = {}) {
  const app = express();
  app.use(express.json());

  app.get('/health', async (req, res) => {
    try {
      const result = await db.query('SELECT NOW() AS server_time');
      res.json({
        status: 'ok',
        serverTime: result.rows[0]?.server_time ?? null,
      });
    } catch (error) {
      res.status(503).json({
        status: 'degraded',
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.use((req, res, next) => {
    if (!apiToken) {
      return res.status(503).json({ error: 'CONTROL_API_TOKEN is not configured' });
    }

    const receivedToken = extractApiKey(req);

    if (!receivedToken || receivedToken !== apiToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    return next();
  });

  app.get('/status', (req, res) => {
    res.json({
      engine: 'surgical-orchestrator',
      version: '1.0.0',
      workspace: config.workspaceRoot,
      presence: getPresenceStatus(),
      driverAvailable: Boolean(driver?.runLoop),
    });
  });

  app.post('/v1/tasks', async (req, res) => {
    const objective = typeof req.body?.objective === 'string' ? req.body.objective.trim() : '';
    const payload = req.body?.payload && typeof req.body.payload === 'object' && !Array.isArray(req.body.payload)
      ? req.body.payload
      : {};

    if (!objective) {
      return res.status(400).json({ error: 'objective is required' });
    }

    if (!driver?.runLoop || typeof driver.runLoop !== 'function') {
      return res.status(503).json({ error: 'Task driver is not available' });
    }

    const taskRecord = await insertTask(db, {
      id: crypto.randomUUID(),
      objective,
      payload,
    });

    void runTask(driver, db, taskRecord);

    return res.status(202).json({
      task: taskRecord,
    });
  });

  app.get('/v1/tasks/:id', async (req, res) => {
    const task = await getTaskById(db, req.params.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.json({ task });
  });

  app.get('/v1/tasks', async (req, res) => {
    const tasks = await listTasks(db);
    return res.json({ tasks });
  });

  app.get('/v1/presence', (req, res) => {
    return res.json({ presence: getPresenceStatus() });
  });

  return app;
}
