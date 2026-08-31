import { db } from '../db.js';
import { getClient } from '../farm/clientPool.js';
import { startListening } from './listener.js';
import { scoreLead } from './filter.js';
import { createLead, logAction } from '../../server.js';
import { decideNextAction } from '../ai/brain.js';
import { generateByStrategy } from '../ai/generator.js';
import { sendMessageSmart } from '../farm/sendMessage.js';
import { logger } from '../system/logger.js';

const connectedListeners = new Set<number>();

export async function bootAllListeners() {
  logger.info({ type: 'system', message: 'Booting all farm listeners...' });
  
  const res = await db.query(`
    SELECT * FROM farm_accounts 
    WHERE status IN ('active', 'warmup') 
      AND (role = 'hybrid' OR role = 'hunter')
  `);

  for (const account of res.rows) {
    if (connectedListeners.has(account.id)) continue;

    try {
      const client = await getClient(account);
      startListening(client, async (msg: any) => {
          handleIncomingTraffic(msg, account);
      });
      connectedListeners.add(account.id);
      logger.info({ type: 'worker', message: `Attached listener to account #${account.id} (${account.phone})`, accountId: account.id });
    } catch (e: any) {
      logger.error({ type: 'worker', message: `Failed to boot account #${account.id}`, accountId: account.id, error: e.message });
    }
  }
}

async function handleIncomingTraffic(msg: any, account: any) {
    try {
      const { saveMessage } = await import('../../server.js');
      await saveMessage({
        id: new Date().getTime().toString(),
        username: msg.userId?.toString() || 'Unknown',
        chat: msg.chatId?.toString() || 'Unknown',
        text: msg.text || ''
      });

      const score = await scoreLead(msg.text);
      if (score && score.isLead && score.confidence >= 0.7 && score.temperature !== 'cold') {
        logger.info({ type: 'lead', message: `High score lead detected: ${score.confidence}`, accountId: account.id, chatId: msg.chatId.toString(), additional: { score } });
        
        const lead = await createLead({
            userId: msg.userId,
            username: "unknown",
            chat: msg.chatId.toString(),
            text: msg.text,
            scoring: score
        });

        const decision = await decideNextAction({
          text: msg.text,
          context: msg.text,
          basePrice: 2000
        });

        const reply = generateByStrategy(decision.strategy, decision.message);
        if (reply) {
          // Идет авто-ответ через текущий фарм-аккаунт
          await sendMessageSmart(msg.userId, reply, account.id);
          
          await logAction({
            type: 'proactive_reply',
            user: msg.userId,
            chat: msg.chatId.toString(),
            content: reply,
            reason: `Auto lead from traffic engine via account #${account.id}`
          });
        }
      }
    } catch(e: any) {
      logger.error({ type: 'worker', message: `Traffic listener error: ${e.message}`, accountId: account.id });
    }
}

