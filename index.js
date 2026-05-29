import { once } from 'node:events';
import { pathToFileURL } from 'node:url';

import { GeminiDriver } from './src/brain/geminiDriver.js';
import { config } from './src/config.js';
import { createControlAPI } from './src/control/api.js';
import { runTool } from './src/tools/registry.js';

function createDriver() {
  try {
    return new GeminiDriver({ runTool });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    console.warn(`Control API starting without task driver: ${detail}`);
    return null;
  }
}

export async function startServer({
  driver = createDriver(),
  port = config.controlApiPort,
  host = config.controlApiHost,
  db,
  listen = true,
} = {}) {
  const app = createControlAPI({ driver, db });

  if (!listen) {
    return { app, server: null, driver };
  }

  const server = app.listen(port, host);
  await once(server, 'listening');

  return { app, server, driver };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { server } = await startServer();
  const address = server.address();
  const actualPort = typeof address === 'object' && address ? address.port : config.controlApiPort;
  console.log(`Control API listening on ${config.controlApiHost}:${actualPort}`);
}
