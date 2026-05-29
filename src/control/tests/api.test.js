import { strict as assert } from 'node:assert';

process.env.CONTROL_API_TOKEN = 'control-secret';

const { startServer } = await import('../../../index.js');

function createFakeDb() {
  const tasks = new Map();

  return {
    async query(sql, params = []) {
      if (sql.includes('SELECT NOW() AS server_time')) {
        return {
          rows: [{ server_time: '2026-05-29T12:00:00.000Z' }],
        };
      }

      if (sql.includes('INSERT INTO tasks')) {
        const [id, objective, status, payload] = params;
        const row = {
          id,
          objective,
          status,
          payload: JSON.parse(payload),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        tasks.set(id, row);
        return { rows: [row] };
      }

      if (sql.includes('UPDATE tasks')) {
        const [id, status, payload] = params;
        const existing = tasks.get(id);
        const row = {
          ...existing,
          status,
          payload: JSON.parse(payload),
          updated_at: new Date().toISOString(),
        };
        tasks.set(id, row);
        return { rows: [row] };
      }

      if (sql.includes('WHERE id = $1')) {
        const row = tasks.get(params[0]);
        return { rows: row ? [row] : [] };
      }

      if (sql.includes('ORDER BY created_at DESC, updated_at DESC')) {
        return {
          rows: Array.from(tasks.values()).sort((left, right) => right.created_at.localeCompare(left.created_at)),
        };
      }

      throw new Error(`Unexpected query: ${sql}`);
    },
  };
}

function createRequest({ method, path, headers = {}, body }) {
  const normalizedHeaders = Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), value])
  );

  return {
    method: method.toUpperCase(),
    path,
    body,
    params: {},
    get(name) {
      return normalizedHeaders[name.toLowerCase()] ?? undefined;
    },
  };
}

function createResponse() {
  let resolveResponse;
  const done = new Promise((resolve) => {
    resolveResponse = resolve;
  });

  const response = {
    statusCode: 200,
    body: undefined,
    headersSent: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      this.headersSent = true;
      resolveResponse(this);
      return this;
    },
  };

  return { response, done };
}

async function invokeApp(app, { method, path, headers, body }) {
  const stack = app.router.stack;
  const req = createRequest({ method, path, headers, body });
  const { response: res, done } = createResponse();

  let index = 0;

  const dispatch = async () => {
    if (res.headersSent) {
      return;
    }

    const layer = stack[index++];

    if (!layer) {
      throw new Error(`No route handled ${method} ${path}`);
    }

    if (!layer.route) {
      if (layer.name === 'jsonParser') {
        return dispatch();
      }

      await layer.handle(req, res, dispatch);
      return;
    }

    if (!layer.match(path) || !layer.route.methods[method.toLowerCase()]) {
      return dispatch();
    }

    req.params = layer.params ?? {};
    await layer.handle(req, res, dispatch);
  };

  await dispatch();
  return done;
}

async function waitForTaskCompletion(app, taskId, headers) {
  for (let i = 0; i < 20; i++) {
    const response = await invokeApp(app, {
      method: 'GET',
      path: `/v1/tasks/${taskId}`,
      headers,
    });

    if (response.body?.task?.status === 'done') {
      return response.body.task;
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  throw new Error(`Timed out waiting for task ${taskId} to complete`);
}

async function testControlAPI() {
  const fakeDb = createFakeDb();
  const driverCalls = [];
  const fakeDriver = {
    async runLoop(task) {
      driverCalls.push(task);
      return {
        finalSummary: `Completed: ${task.objective}`,
      };
    },
  };

  const { app, server } = await startServer({
    driver: fakeDriver,
    db: fakeDb,
    listen: false,
  });

  assert.strictEqual(server, null, 'Smoke start should allow bootstrapping without binding a socket');

  const authHeaders = {
    'x-api-key': 'control-secret',
  };

  const healthResponse = await invokeApp(app, {
    method: 'GET',
    path: '/health',
  });
  assert.strictEqual(healthResponse.statusCode, 200, 'Health endpoint should be public');

  const unauthorizedResponse = await invokeApp(app, {
    method: 'GET',
    path: '/v1/tasks',
  });
  assert.strictEqual(unauthorizedResponse.statusCode, 401, 'Protected endpoints should require the API key');

  const createResponse = await invokeApp(app, {
    method: 'POST',
    path: '/v1/tasks',
    headers: authHeaders,
    body: {
      objective: 'Start the server smoke test',
      payload: { source: 'api-test' },
    },
  });
  assert.strictEqual(createResponse.statusCode, 202, 'Task creation should return 202');
  const taskId = createResponse.body.task.id;
  assert.ok(taskId, 'Created task should include an id');
  assert.strictEqual(createResponse.body.task.status, 'pending', 'Created task should begin pending');

  const taskResponse = await invokeApp(app, {
    method: 'GET',
    path: `/v1/tasks/${taskId}`,
    headers: authHeaders,
  });
  assert.strictEqual(taskResponse.statusCode, 200, 'Task lookup should succeed');

  const completedTask = await waitForTaskCompletion(app, taskId, authHeaders);
  assert.strictEqual(completedTask.status, 'done', 'Background driver run should mark the task done');
  assert.strictEqual(completedTask.payload.finalSummary, 'Completed: Start the server smoke test');

  const listResponse = await invokeApp(app, {
    method: 'GET',
    path: '/v1/tasks',
    headers: authHeaders,
  });
  assert.strictEqual(listResponse.body.tasks.length, 1, 'Task listing should return stored tasks');

  const presenceResponse = await invokeApp(app, {
    method: 'GET',
    path: '/v1/presence',
    headers: authHeaders,
  });
  assert.strictEqual(presenceResponse.body.presence.active, false, 'Presence should default to offline');

  assert.strictEqual(driverCalls.length, 1, 'Driver should run exactly once');

  console.log('Control API tests passed!');
}

testControlAPI().catch((err) => {
  console.error(err);
  process.exit(1);
});
