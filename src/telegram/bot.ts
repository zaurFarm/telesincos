import TelegramBot from 'node-telegram-bot-api';
import {
  upsertUser,
  saveMessage,
  logAction,
  isDuplicate,
  saveCompetitor,
  getUserStyle
} from '../../server.js';
import { moderateMessage } from '../ai/moderation.js';
import { generateReply } from '../ai/chat.js';
import { parseCompetitorMessage } from '../ai/parser.js';

const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

export const bot = token ? new TelegramBot(token, { polling: true }) : null;

if (bot) {
  bot.on('message', async (msg) => {
    try {
      const user = msg.from;
      const text = msg.text || msg.caption || '';

      if (!user || !text) return;

      // 👤 сохраняем пользователя
      await upsertUser({
        id: user.id.toString(),
        username: user.username,
        first_name: user.first_name
      });

      const chatTitle = msg.chat.title || 'Private Chat';

      // 💬 сохраняем историю
      await saveMessage({
        id: msg.message_id.toString(),
        username: user.username || user.first_name,
        chat: chatTitle,
        text
      });

      // 🚫 проверка дублей
      if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
        if (await isDuplicate(text)) {
          await bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});

          await logAction({
            type: 'delete',
            user: user.username || user.first_name,
            chat: chatTitle,
            content: text,
            reason: 'duplicate'
          });

          return;
        }
      }

      // 💰 AI парсинг цен конкурентов
      const parsed = await parseCompetitorMessage(text);
      if (parsed && parsed.product) {
        // Фильтр от мусора (слишком длинная цена)
        if (!parsed.price || parsed.price.length <= 20) {
          await saveCompetitor({
            group: chatTitle,
            seller: parsed.seller || user.username || user.first_name || 'Unknown',
            productText: parsed.product,
            price: parsed.price
          });
        }
      }

      // 🧠 AI модерация
      const mod = await moderateMessage(text);
      if (mod.shouldDelete) {
        await bot.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});

        await logAction({
          type: 'delete',
          user: user.username || user.first_name,
          chat: chatTitle,
          content: text,
          reason: mod.reason || 'AI moderation'
        });

        return;
      }

      // 🤖 AI ответ (если тегнули бота)
      const botInfo = await bot.getMe();
      if (text.includes(`@${botInfo.username}`)) {
        const styles = await getUserStyle();
        const reply = await generateReply(text.replace(`@${botInfo.username}`, '').trim(), styles);

        if (reply) {
          await bot.sendMessage(msg.chat.id, reply, {
            reply_to_message_id: msg.message_id
          });

          await logAction({
            type: 'reply',
            user: user.username || user.first_name,
            chat: chatTitle,
            content: reply
          });
        }
      }

    } catch (err) {
      console.error('Bot error:', err);
    }
  });
  console.log('✅ Telegram Bot started');
} else {
  console.log('⚠️ BOT_TOKEN not provided. Telegram Bot is disabled.');
}


