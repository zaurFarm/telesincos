import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import { NewMessage } from 'telegram/events/index.js';
import input from 'input';
import dotenv from 'dotenv';
import { scoreMessage } from '../ai/scoring.js';
import { generateSalesReply } from '../ai/sales.js';
import { detectBuyingStage } from '../ai/intent.js';
import { analyzeRisk } from '../ai/risk.js';
import { detectClientType } from '../ai/classifier.js';
import { decideNextAction } from '../ai/brain.js';
import { generateByStrategy } from '../ai/generator.js';
import { getPersonality, updateMood } from '../ai/personality.js';
import { decideBehavior } from '../ai/behavior.js';
import { decideResponseType } from '../ai/responseType.js';
import { humanizeStyle } from '../ai/humanStyle.js';
import { generateVoice, generateVideoNote } from '../ai/voice.js';
import { updateRelation, getRelation } from '../ai/relationship.js';
import { decideStrategy } from '../ai/relationshipBehavior.js';
import { getMemory, updateMemory, getEmotionBias } from '../ai/emotionMemory.js';
import { detectEmotion, getEmotionModifiers, applyEmotion } from '../ai/emotion.js';
import { generateSmartReply } from '../ai/sales.js';
import { 
  isAlreadyContacted, 
  markAsContacted, 
  logAction, 
  saveConversation, 
  getConversationContext,
  createLead,
  updateLeadStatus,
  updateLeadStage,
  getLeadByUserIdAndChatId,
  logRisk,
  logMessageStat,
  logMessageTest,
  markMessageTestSuccess
} from '../../server.js';
import { db as pool } from '../db.js';
import { logger } from '../system/logger.js';
import { canSendMessage, incrementMessageCount } from '../antiban/limits.js';
import { getRandomDelay, sleep } from '../antiban/delay.js';
import { humanizeText } from '../antiban/humanize.js';
import { sendWithFallback } from '../farm/sendMessage.js';
import { calculateTrustScore, isNewUser } from '../ai/trust.js';
import { decidePaymentMethod, generatePaymentReply, maybeOfferPickup, generateTrustReply } from '../ai/paymentStrategy.js';
import { generatePrepaymentMessage } from '../ai/prepayment.js';
import { calculateLeadScore } from '../ai/leadScore.js';
import { getAutoStrategy } from '../ai/autoStrategy.js';
import { aiQueue } from '../queue/index.js';
import { shouldLearn } from '../ai/trainingFilter.js';
import { getEmbedding } from '../ai/embedding.js';

dotenv.config();

const stringSession = new StringSession(process.env.SESSION || '');

let clientInstance: TelegramClient | null = null;

export function getClient() {
  if (!clientInstance) {
    throw new Error('TelegramClient is not initialized. Must run with ROLE=userbot.');
  }
  return clientInstance;
}

export async function startUserbot() {
  if (process.env.ROLE !== 'userbot') {
    console.log('⚠️ Process role is not userbot. Skipping userbot bootstrap.');
    return;
  }

  if (!process.env.API_ID || !process.env.API_HASH) {
    console.log('⚠️ API_ID or API_HASH not provided. Userbot is disabled.');
    return;
  }

  try {
    clientInstance = new TelegramClient(
      stringSession,
      Number(process.env.API_ID),
      process.env.API_HASH,
      { connectionRetries: 5 }
    );

    await clientInstance.start({
      phoneNumber: async () => await input.text('Phone: '),
      password: async () => await input.text('Password: '),
      phoneCode: async () => await input.text('Code: '),
      onError: (err) => console.log(err)
    });

    console.log('✅ Userbot started');
    console.log('[USERBOT] Session loaded');

    import('../system/shutdown.js').then(module => {
      module.registerShutdownHook(async () => {
        console.log('[USERBOT] Disconnecting from Telegram...');
        await clientInstance?.disconnect();
        console.log('[USERBOT] Disconnected.');
      });
    });

    // Setup message handler
    clientInstance.addEventHandler(async (event: any) => {
      try {
        const message = event.message;
        console.log('[USERBOT][EVENT] got message, out=' + (message && message.out) + ' len=' + ((message && (message.text||message.message)||'').length));
        if (!message || message.out) return; // Игнорируем свои сообщения

        const text = message.text || message.message || '';
        
        // Базовые фильтры, чтобы не спамить и не тратить ресурсы ИИ
        if (text.length < 5) return;
        if (text.includes('http')) return;
        if (text.includes('@')) return;

        let chat: any = null;
        try { chat = await message.getChat(); } catch (e) { console.debug('[userbot] getChat failed:', e?.message); }
        const isGroup = chat ? (chat.isGroup || chat.isChannel) : false;
        let sender: any = null;
        try { sender = await message.getSender(); } catch (e) { console.debug('[userbot] getSender failed:', e?.message); }
        const username = sender?.username;
        const userId = sender?.id?.toString() || username || message.senderId?.toString() || 'unknown';
        const chatId = (chat?.id?.toString()) || message.chatId?.toString() || message.peerId?.toString() || userId;
        const isPrivate = message.isPrivate;

        const { createSpan } = await import('../system/tracer.js');
        const span = createSpan('webhook_received', null);

        // 🛡️ AI RISK SCORING
        const risk = await analyzeRisk(text);
        
        // Риск только логируем — НЕ обрываем диалог шаблоном.
        // Бот всегда думает над сообщением и отвечает по-человечески (генерация в worker).
        if (risk.risk === 'high' || risk.risk === 'medium') {
          await logRisk(userId, risk.risk, risk.flags);
        }

        // 🏫 CHAT LEARNING ENGINE (RAG)
        if (isGroup && shouldLearn(text)) {
           // We might want to check against a whitelisted / blacklisted array of chats here
           const TRAINING_BLOCKED_CHATS = ['spam_group'];
           if (!TRAINING_BLOCKED_CHATS.includes(chatId)) {
               try {
                   const embedding = await getEmbedding(text);
                   if (embedding && embedding.length > 0) {
                      await pool.query(`
                        INSERT INTO group_training_messages (chat_id, user_id, text, embedding, type)
                        VALUES ($1, $2, $3, $4, 'dialog')
                      `, [chatId, userId, text, JSON.stringify(embedding)]);
                   }
               } catch (e) {
                   console.error('[Training] Failed to save dialog', e);
               }
           }
        }

        // 📍 ЛОГИКА ОБРАБОТКИ ОТВЕТА ЛИДА И ПРОАКТИВНЫЕ ПРОДАЖИ
        const isReplyToUs = message.replyTo?.replyToMsgId ? true : false;
        
        // 🚦 QUEUE BACKPRESSURE CHECK
        const jobCounts = await aiQueue.getJobCounts('wait', 'active', 'delayed');
        const queueSize = jobCounts.wait + jobCounts.active;
        if (queueSize > 100) {
          logger.warn({ type: 'queue_backpressure', size: queueSize, msg: 'Dropping or delaying input due to large queue' });
          return; // Drop input
        }

        await aiQueue.add('processMessage', {
          text,
          userId,
          chatId,
          username,
          isPrivate,
          isReplyToUs,
          isGroup,
          msgId: message.id,
          chatTitle: chat?.title || null,
          firstName: sender?.firstName,
          span
        }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 }
        });
      } catch (e) {
        console.error("Userbot event handler error", e);
      }
    }, new NewMessage({}));

    // Wake up the update loop: gramJS won't receive events until dialogs are fetched
    try {
      await clientInstance.getDialogs({ limit: 10 });
      const me = await clientInstance.getMe();
      console.log('[USERBOT] Listening for messages as', (me && me.username) ? '@' + me.username : (me && me.firstName) || 'account');
    } catch (e) {
      console.error('[USERBOT] Warmup getDialogs failed:', e?.message);
    }

  } catch (e) {
    console.error('Userbot start error:', e);
  }
}


