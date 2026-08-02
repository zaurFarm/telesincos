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
import { db } from '../db.js';
import { runWithContext, createContext } from '../system/context.js';
import { getSettings } from '../system/settings.js';
import { getSimilarMessages, saveTrainingMessage } from '../ai/memory/retrieval.js';

const token = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;

export const bot = token ? new TelegramBot(token, { polling: true }) : null;

// Находит tenant (workspace) владельца платформы по его Telegram ID.
// Возвращает null, если этот Telegram-аккаунт ещё не привязан ни к одному пользователю.
async function resolveTenantByTelegramId(telegramId: string): Promise<{ tenantId: string; userId: string } | null> {
  try {
    const r = await db.query(
      `SELECT su.id as user_id, w.id as workspace_id
       FROM saas_users su
       LEFT JOIN workspaces w ON w.owner_id = su.id
       WHERE su.telegram_id = $1 LIMIT 1`,
      [telegramId]
    );
    if (r.rows.length === 0) return null;
    const row = r.rows[0];
    return { tenantId: row.workspace_id || row.user_id, userId: row.user_id };
  } catch (e) {
    console.error('[Bot] resolveTenantByTelegramId error:', e);
    return null;
  }
}

// Обработка /start КОД — привязка Telegram-аккаунта к пользователю платформы
async function handleStartLinking(msg: any): Promise<boolean> {
  const text = msg.text || '';
  const match = text.match(/^\/start\s+([A-Z0-9]+)/i);
  if (!match) return false;

  const code = match[1].toUpperCase();
  const telegramId = msg.from.id.toString();

  try {
    const codeRes = await db.query(
      `SELECT * FROM telegram_link_codes WHERE code = $1 AND used = false AND expires_at > NOW()`,
      [code]
    );
    if (codeRes.rows.length === 0) {
      await bot!.sendMessage(msg.chat.id, '❌ Код недействителен или истёк. Сгенерируйте новый в личном кабинете → Настройки.');
      return true;
    }

    const linkRow = codeRes.rows[0];
    await db.query(`UPDATE saas_users SET telegram_id = $1 WHERE id = $2`, [telegramId, linkRow.saas_user_id]);
    await db.query(`UPDATE telegram_link_codes SET used = true WHERE code = $1`, [code]);

    await bot!.sendMessage(
      msg.chat.id,
      '✅ Аккаунт успешно привязан! Теперь я буду вашим личным ассистентом — общаюсь, анализирую и присылаю аналитику по вашим настройкам из личного кабинета.'
    );
  } catch (e) {
    console.error('[Bot] link code error:', e);
    await bot!.sendMessage(msg.chat.id, '⚠️ Ошибка привязки аккаунта. Попробуйте ещё раз позже.');
  }
  return true;
}

if (bot) {
  bot.on('message', async (msg) => {
    try {
      const user = msg.from;
      const text = msg.text || msg.caption || '';
      if (!user || !text) return;

      const isPrivate = msg.chat.type === 'private';

      // Обработка привязки аккаунта в личных сообщениях
      if (isPrivate && text.startsWith('/start')) {
        const handled = await handleStartLinking(msg);
        if (handled) return;
      }

      // Определяем контекст: личный чат с владельцем платформы -> его личный tenant.
      // Групповой чат (мониторинг рынка, антидубли) -> общий системный контекст.
      let tenantId = process.env.DEFAULT_TENANT || 'tenant_1';
      let isOwnerChat = false;

      if (isPrivate) {
        const owner = await resolveTenantByTelegramId(user.id.toString());
        if (owner) {
          tenantId = owner.tenantId;
          isOwnerChat = true;
        } else {
          // Личное сообщение от незнакомого Telegram-аккаунта — просим привязаться
          await bot!.sendMessage(
            msg.chat.id,
            'Привет! Чтобы я стал вашим личным ассистентом, привяжите этот аккаунт в личном кабинете платформы (Настройки → Подключить Telegram) и перейдите по выданной ссылке.'
          );
          return;
        }
      }

      await runWithContext(createContext(tenantId, isOwnerChat ? 'user' : 'system'), async () => {
        await processMessage(msg, user, text, isPrivate, isOwnerChat, tenantId);
      });

    } catch (err) {
      console.error('Bot error:', err);
    }
  });
  console.log('✅ Telegram Bot started (multi-tenant mode)');
} else {
  console.log('⚠️ BOT_TOKEN not provided. Telegram Bot is disabled.');
}

async function processMessage(msg: any, user: any, text: string, isPrivate: boolean, isOwnerChat: boolean, tenantId: string) {
  // 👤 сохраняем пользователя (лид/собеседник)
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

  // 🧠 сохраняем реплику в conversations (память диалога) с привязкой к тенанту
  try {
    await db.withTenant(tenantId, (cl: any) => cl.query(
      `INSERT INTO conversations (user_id, chat_id, role, message, tenant_id) VALUES ($1, $2, 'user', $3, $4)`,
      [user.id.toString(), msg.chat.id.toString(), text, tenantId]
    ));
  } catch (e) { /* не блокируем обработку */ }

  // 🧠 сохраняем в векторную память для быстрого будущего поиска (RAG)
  void saveTrainingMessage(msg.chat.id.toString(), user.id.toString(), 'user', text);

  const settings = getSettings(tenantId);

  // 🚫 проверка дублей (только в группах)
  if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
    if (settings.preventDuplicates && await isDuplicate(text)) {
      await bot!.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
      await logAction({ type: 'delete', user: user.username || user.first_name, chat: chatTitle, content: text, reason: 'duplicate' });
      return;
    }
  }

  // 💰 AI парсинг цен конкурентов (в группах — сравнение цен с рынком)
  const parsed = await parseCompetitorMessage(text);
  if (parsed && parsed.product) {
    if (!parsed.price || parsed.price.length <= 20) {
      await saveCompetitor({
        group: chatTitle,
        seller: parsed.seller || user.username || user.first_name || 'Unknown',
        productText: parsed.product,
        price: parsed.price
      });
    }
  }

  // 🧠 AI модерация — режим "модератор" (только если включён в настройках пользователя)
  const modEnabled = settings.botMode === 'moderator' || settings.botMode === 'both';
  if (modEnabled && settings.moderationEnabled) {
    const mod = await moderateMessage(text);
    if (mod.shouldDelete) {
      await bot!.deleteMessage(msg.chat.id, msg.message_id).catch(() => {});
      await logAction({ type: 'delete', user: user.username || user.first_name, chat: chatTitle, content: text, reason: mod.reason || 'AI moderation' });
      return;
    }
  }

  // 🤖 AI ответ — режим "собеседник" (личка владельца или упоминание в группе)
  const chatModeEnabled = settings.botMode === 'companion' || settings.botMode === 'both';
  if (!chatModeEnabled) return;

  const botInfo = await bot!.getMe();
  const isMentioned = text.includes(`@${botInfo.username}`);
  if (!(isMentioned || isPrivate)) return;

  const cleanText = text.replace(`@${botInfo.username}`, '').trim();
  const styles = await getUserStyle();

  // Память: похожие сообщения из векторного поиска + последние реплики диалога
  const [similar, historyRows] = await Promise.all([
    getSimilarMessages(cleanText).catch(() => []),
    db.withTenant(tenantId, (cl: any) => cl.query(
      `SELECT role, message FROM conversations WHERE user_id = $1 AND tenant_id = $2 ORDER BY created_at DESC LIMIT 15`,
      [user.id.toString(), tenantId]
    )).then((r: any) => r.rows).catch(() => [])
  ]);

  const history = historyRows.reverse().map((r: any) => `${r.role === 'user' ? 'Собеседник' : 'Ты'}: ${r.message}`);
  const memoryContext = similar.length
    ? '\\n\\nРелевантные факты из памяти:\\n' + similar.map((s: any) => typeof s === 'string' ? s : s.message).join('\\n')
    : '';

  const personalPrompt = settings.chatPrompt + memoryContext;
  const reply = await generateReply(cleanText, personalPrompt, history);

  if (reply) {
    await bot!.sendMessage(msg.chat.id, reply, { reply_to_message_id: msg.message_id });

    try {
      await db.withTenant(tenantId, (cl: any) => cl.query(
        `INSERT INTO conversations (user_id, chat_id, role, message, tenant_id) VALUES ($1, $2, 'assistant', $3, $4)`,
        [user.id.toString(), msg.chat.id.toString(), reply, tenantId]
      ));
    } catch (e) { /* не блокируем */ }

    void saveTrainingMessage(msg.chat.id.toString(), user.id.toString(), 'assistant', reply);

    await logAction({ type: 'reply', user: user.username || user.first_name, chat: chatTitle, content: reply });
  }
}
