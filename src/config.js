import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { z } from 'zod';

// For local testing, allow missing env vars if not production
loadEnv();

const defaultWorkspacePath = '/Users/aritrarpal/Documents/workspace_biz/surgical-orchestrator/workspace';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  
  // Database Configuration (optional for early foundation tests)
  DATABASE_URL: z.string().optional().default('postgres://user:password@localhost:5432/surgical-orchestrator'),
  DATABASE_SCHEMA: z.string().regex(/^[a-z_][a-z0-9_]*$/).default('surgical_orchestrator'),
  
  // Model Configuration (Multi-model pipeline)
  GEMINI_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().url().default('http://127.0.0.1:11434'),
  MODEL_PLANNER: z.string().default('gemini-2.5-pro'),
  MODEL_CODER: z.string().default('qwen2.5-coder:7b'),
  MODEL_ROUTER: z.string().default('llama3.2:3b'),
  MODEL_VERIFIER: z.string().default('qwen2.5-coder:7b'),

  // Telegram Collaboration
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_CHAT_ID: z.string().optional(),

  // Control API
  CONTROL_API_TOKEN: z.string().optional(),
  CONTROL_API_PORT: z.coerce.number().int().positive().default(3000),
  CONTROL_API_HOST: z.string().default('127.0.0.1'),

  // Agent Logic
  AUTO_RESUME_ENABLED: z.enum(['true', 'false']).default('true').transform((val) => val === 'true'),
  
  // Skills & Persistence
  SKILLS_BUILTIN_DIR: z.string().default('skills/builtin'),
  MEMORY_RETENTION_ENABLED: z.enum(['true', 'false']).default('true').transform((val) => val === 'true'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(`Invalid surgical-orchestrator configuration: ${JSON.stringify(parsedEnv.error.issues, null, 2)}`);
}

const env = parsedEnv.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  databaseSchema: env.DATABASE_SCHEMA,
  
  geminiApiKey: env.GEMINI_API_KEY,
  ollamaBaseUrl: env.OLLAMA_BASE_URL,
  
  // Orchestration Models
  modelPlanner: env.MODEL_PLANNER,
  modelCoder: env.MODEL_CODER,
  modelRouter: env.MODEL_ROUTER,
  modelVerifier: env.MODEL_VERIFIER,

  telegramBotToken: env.TELEGRAM_BOT_TOKEN,
  telegramChatId: env.TELEGRAM_CHAT_ID,
  controlApiToken: env.CONTROL_API_TOKEN,
  controlApiPort: env.CONTROL_API_PORT,
  controlApiHost: env.CONTROL_API_HOST,
  
  workspaceRoot: defaultWorkspacePath,
  
  autoResumeEnabled: env.AUTO_RESUME_ENABLED,
  skillsBuiltinDir: env.SKILLS_BUILTIN_DIR,
  memoryRetentionEnabled: env.MEMORY_RETENTION_ENABLED,
};
