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

      // 🧠 сохраняем реплику юзера в conversations (для памяти диалога)
      try {
        const { db } = await import('../../src/db.js');
        const TEN = process.env.DEFAULT_TENANT || 'tenant_1'; await db.withTenant(TEN, (cl) => cl.query(`INSERT INTO conversations (user_id, chat_id, role, message, tenant_id) VALUES ($1, $2, 'user', $3, $4)`, [user.id.toString(), msg.chat.id.toString(), text, TEN]));
      } catch(e) { /* не блокируем обработку */ }

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

      // 🤖 AI ответ (если тегнули бота или личка)
      const isPrivate = msg.chat.type === 'private';
      const botInfo = await bot.getMe();
      const isMentioned = text.includes(`@${botInfo.username}`);
      if (isMentioned || isPrivate) {
        const cleanText = text.replace(`@${botInfo.username}`, '').trim();
        const styles = await getUserStyle();
        // Загружаем историю диалога с этим юзером
        let history: string[] = [];
        try {
          const { rows } = await (await import('../../src/db.js')).db.query(
            `SELECT role, message FROM conversations
             WHERE user_id = $1
             ORDER BY created_at DESC LIMIT 15`,
            [user.id.toString()]
          );
          history = rows.reverse().map((r: any) =>
            `${r.role === 'user' ? 'Собеседник' : 'Ты'}: ${r.message}`
          );
        } catch(e) { /* Redis/DB недоступен — отвечаем без истории */ }
        const reply = await generateReply(cleanText, styles, history);

        if (reply) {
          await bot.sendMessage(msg.chat.id, reply, {
            reply_to_message_id: msg.message_id
          });
          try {
            const { db } = await import('../../src/db.js');
            await db.query(
              `INSERT INTO conversations (user_id, chat_id, role, message)
               VALUES ($1, $2, 'assistant', $3)`,
              [user.id.toString(), msg.chat.id.toString(), reply]
            );
          } catch(e) { /* не блокируем */ }

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


