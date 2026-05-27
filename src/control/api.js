import express from 'express';
import { config } from '../config.js';

export function createControlAPI(driver) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/status', (req, res) => {
    res.json({ 
      engine: 'Arnold',
      version: '1.0.0',
      workspace: config.workspaceRoot 
    });
  });

  return app;
}
