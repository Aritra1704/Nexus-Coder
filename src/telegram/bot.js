import { Telegraf } from 'telegraf';

import { config } from '../config.js';
import { getPool } from '../db/client.js';

const ACTIVE_TASK_STATUSES = ['pending', 'in_progress', 'waiting_approval', 'blocked'];

let presenceState = {
  active: false,
  chatId: config.telegramChatId ?? null,
  activatedAt: null,
  source: config.telegramChatId ? 'config' : null,
};

let botInstance;

function formatObjective(text, maxLength = 80) {
  const normalized = typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';

  if (normalized.length <= maxLength) {
    return normalized || 'No objective provided';
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function formatTimestamp(value) {
  if (!value) {
    return 'unknown';
  }

  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'unknown' : date.toISOString();
}

function formatTaskList(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return 'None';
  }

  return tasks
    .map((task) => `- ${task.id} [${task.status}] ${formatObjective(task.objective)} (${formatTimestamp(task.updated_at ?? task.created_at)})`)
    .join('\n');
}

async function getStatusSnapshot(db) {
  const heartbeat = await db.query(
    `
      SELECT NOW() AS server_time
    `
  );
  const activeTasks = await db.query(
    `
      SELECT id, objective, status, created_at, updated_at
      FROM tasks
      WHERE status = ANY($1::text[])
      ORDER BY updated_at DESC, created_at DESC
      LIMIT 10
    `,
    [ACTIVE_TASK_STATUSES]
  );

  return {
    health: 'healthy',
    serverTime: heartbeat.rows[0]?.server_time ?? null,
    activeTasks: activeTasks.rows,
    presence: { ...presenceState },
  };
}

async function getRecentTasks(db, limit = 5) {
  const result = await db.query(
    `
      SELECT id, objective, status, created_at, updated_at
      FROM tasks
      ORDER BY created_at DESC, updated_at DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows;
}

function formatStatusMessage(snapshot) {
  return [
    `Arnold Health: ${snapshot.health}`,
    `Presence: ${snapshot.presence.active ? 'active' : 'offline'}`,
    `Presence Chat: ${snapshot.presence.chatId ?? 'unregistered'}`,
    `Server Time: ${formatTimestamp(snapshot.serverTime)}`,
    'Active Tasks:',
    formatTaskList(snapshot.activeTasks),
  ].join('\n');
}

function formatRecentTasksMessage(tasks) {
  return [
    'Last 5 Tasks:',
    formatTaskList(tasks),
  ].join('\n');
}

function getNotificationChatId() {
  return presenceState.chatId ?? config.telegramChatId ?? null;
}

export function getPresenceStatus() {
  return { ...presenceState };
}

export function isPresenceActive() {
  return presenceState.active;
}

export function setPresenceActive(chatId, source = 'manual') {
  presenceState = {
    active: true,
    chatId: chatId ?? presenceState.chatId ?? null,
    activatedAt: new Date().toISOString(),
    source,
  };

  return getPresenceStatus();
}

export function createTelegramBot({
  db = getPool(),
  token = config.telegramBotToken,
  defaultChatId = config.telegramChatId ?? null,
  TelegrafClass = Telegraf,
} = {}) {
  if (defaultChatId && !presenceState.chatId) {
    presenceState = {
      ...presenceState,
      chatId: defaultChatId,
      source: 'config',
    };
  }

  if (!token) {
    return {
      bot: null,
      isEnabled: false,
      getPresenceStatus,
      isPresenceActive,
      setPresenceActive,
      async sendMessage() {
        return { sent: false, reason: 'telegram_not_configured' };
      },
      async broadcastTaskUpdate() {
        return { sent: false, reason: 'telegram_not_configured' };
      },
      launch: async () => false,
      stop: async () => false,
    };
  }

  const bot = new TelegrafClass(token);

  bot.command('status', async (ctx) => {
    try {
      const snapshot = await getStatusSnapshot(db);
      await ctx.reply(formatStatusMessage(snapshot));
    } catch (error) {
      await ctx.reply(`Arnold Health: degraded\nError: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  bot.command('tasks', async (ctx) => {
    try {
      const tasks = await getRecentTasks(db, 5);
      await ctx.reply(formatRecentTasksMessage(tasks));
    } catch (error) {
      await ctx.reply(`Could not load recent tasks: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  bot.command('online', async (ctx) => {
    const chatId = ctx.chat?.id ? String(ctx.chat.id) : defaultChatId;
    const presence = setPresenceActive(chatId, 'telegram');
    await ctx.reply(
      [
        'Presence set to active.',
        `Chat ID: ${presence.chatId ?? 'unregistered'}`,
        `Activated At: ${presence.activatedAt}`,
      ].join('\n')
    );
  });

  return {
    bot,
    isEnabled: true,
    getPresenceStatus,
    isPresenceActive,
    setPresenceActive,
    async sendMessage(chatId, text) {
      const targetChatId = chatId ?? getNotificationChatId();

      if (!targetChatId) {
        return { sent: false, reason: 'telegram_chat_not_registered' };
      }

      await bot.telegram.sendMessage(targetChatId, text);
      return { sent: true, chatId: targetChatId };
    },
    async broadcastTaskUpdate(taskId, message) {
      const targetChatId = getNotificationChatId();

      if (!targetChatId) {
        return { sent: false, reason: 'telegram_chat_not_registered' };
      }

      const text = [`Task Update: ${taskId}`, message].filter(Boolean).join('\n');
      await bot.telegram.sendMessage(targetChatId, text);
      return { sent: true, chatId: targetChatId };
    },
    async launch() {
      await bot.launch();
      return true;
    },
    async stop(reason = 'SIGTERM') {
      await bot.stop(reason);
      return true;
    },
  };
}

export function getTelegramBot(options) {
  if (!botInstance) {
    botInstance = createTelegramBot(options);
  }

  return botInstance;
}

export async function broadcastTaskUpdate(taskId, message) {
  return getTelegramBot().broadcastTaskUpdate(taskId, message);
}
