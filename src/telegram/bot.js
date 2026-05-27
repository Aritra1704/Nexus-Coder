import { Telegraf } from 'telegraf';
import { config } from '../config.js';

export function createTelegramBot() {
  if (!config.geminiApiKey) { // Placeholder check for simplicity
    return null;
  }

  const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || 'dummy-token');

  return {
    bot,
    async sendMessage(chatId, text) {
      if (!bot) return;
      return await bot.telegram.sendMessage(chatId, text);
    }
  };
}
