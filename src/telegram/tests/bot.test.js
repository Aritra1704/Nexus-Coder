import { strict as assert } from 'node:assert';

process.env.TELEGRAM_BOT_TOKEN = 'test-telegram-token';

const { createTelegramBot, getPresenceStatus, isPresenceActive } = await import('../bot.js');

class FakeTelegraf {
  constructor(token) {
    this.token = token;
    this.commands = new Map();
    this.sentMessages = [];
    this.telegram = {
      sendMessage: async (chatId, text) => {
        this.sentMessages.push({ chatId, text });
      },
    };
  }

  command(name, handler) {
    this.commands.set(name, handler);
  }

  async launch() {}

  async stop() {}
}

function createReplyCollector(chatId = 'chat-1') {
  const replies = [];
  return {
    replies,
    ctx: {
      chat: { id: chatId },
      async reply(text) {
        replies.push(text);
      },
    },
  };
}

async function testTelegramCommandsAndBroadcasts() {
  const fakeDb = {
    async query(sql, params = []) {
      if (sql.includes('SELECT NOW() AS server_time')) {
        return {
          rows: [{ server_time: '2026-05-29T10:00:00.000Z' }],
        };
      }

      if (sql.includes('WHERE status = ANY')) {
        assert.deepStrictEqual(params, [['pending', 'in_progress', 'waiting_approval', 'blocked']]);
        return {
          rows: [
            {
              id: 'task-active',
              objective: 'Implement Telegram lifecycle notifications',
              status: 'in_progress',
              created_at: '2026-05-29T09:00:00.000Z',
              updated_at: '2026-05-29T09:30:00.000Z',
            },
          ],
        };
      }

      if (sql.includes('ORDER BY created_at DESC')) {
        assert.deepStrictEqual(params, [5]);
        return {
          rows: [
            {
              id: 'task-5',
              objective: 'Most recent task',
              status: 'done',
              created_at: '2026-05-29T09:55:00.000Z',
              updated_at: '2026-05-29T09:56:00.000Z',
            },
            {
              id: 'task-4',
              objective: 'Previous task',
              status: 'failed',
              created_at: '2026-05-29T08:00:00.000Z',
              updated_at: '2026-05-29T08:10:00.000Z',
            },
          ],
        };
      }

      throw new Error(`Unexpected query: ${sql}`);
    },
  };

  const telegramBot = createTelegramBot({
    db: fakeDb,
    token: 'telegram-token',
    TelegrafClass: FakeTelegraf,
  });

  assert.strictEqual(telegramBot.bot.token, 'telegram-token', 'Bot should initialize Telegraf with the configured token');

  const statusReply = createReplyCollector();
  await telegramBot.bot.commands.get('status')(statusReply.ctx);
  assert.ok(statusReply.replies[0].includes('Arnold Health: healthy'), 'Status command should report health');
  assert.ok(statusReply.replies[0].includes('task-active [in_progress]'), 'Status command should include active tasks');

  const tasksReply = createReplyCollector();
  await telegramBot.bot.commands.get('tasks')(tasksReply.ctx);
  assert.ok(tasksReply.replies[0].includes('Last 5 Tasks:'), 'Tasks command should include a heading');
  assert.ok(tasksReply.replies[0].includes('task-5 [done]'), 'Tasks command should include recent tasks');

  const onlineReply = createReplyCollector('chat-99');
  await telegramBot.bot.commands.get('online')(onlineReply.ctx);
  assert.strictEqual(isPresenceActive(), true, 'Online command should mark presence active');
  assert.strictEqual(getPresenceStatus().chatId, 'chat-99', 'Online command should register the calling chat');
  assert.ok(onlineReply.replies[0].includes('Presence set to active.'), 'Online command should confirm activation');

  const broadcastResult = await telegramBot.broadcastTaskUpdate('task-live', 'Task is running.');
  assert.deepStrictEqual(broadcastResult, { sent: true, chatId: 'chat-99' }, 'Broadcast should target the active chat');
  assert.deepStrictEqual(telegramBot.bot.sentMessages.at(-1), {
    chatId: 'chat-99',
    text: 'Task Update: task-live\nTask is running.',
  });

  console.log('Telegram bot tests passed!');
}

testTelegramCommandsAndBroadcasts().catch((err) => {
  console.error(err);
  process.exit(1);
});
