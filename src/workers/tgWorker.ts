import { Worker } from '../queue/bullmq.js';
import { connection } from '../queue/redis.js';
import { crmQueue, tgDlq } from '../queue/index.js';
import { getClient } from '../telegram/userbot.js';
import { sendMessageSmart } from '../farm/sendMessage.js';
import { generateVoice, generateVideoNote } from '../ai/voice.js';
import { decideResponseType } from '../ai/responseType.js';
import { saveTrainingMessage } from '../ai/memory/retrieval.js';
import { markAccountUsed, handleBanDetection } from '../telegram/accountRouter.js';
import { checkSimilarity, mutateText, saveAccountMessage } from '../antiban/similarityGuard.js';
import { canSend, canSendToChat } from '../antiban/adaptiveLimits.js';
import { calculateHealth, getHealthTier } from '../antiban/accountHealth.js';
import { logger } from '../system/logger.js';
import { createSpan } from '../system/tracer.js';

async function simulateTyping(clientInstance: any, chatId: string, textLength: number) {
  const typingTime = Math.min(4000, textLength * 50);
  try {
     await clientInstance.sendChatAction(chatId, { action: 'typing' });
     await new Promise(r => setTimeout(r, typingTime));
  } catch (e: any) {
     logger.warn({ type: 'simulate_typing_failed', error: e.message, chatId });
  }
}

import { runWithContext, createContext } from '../system/context.js';
import { idempotency } from '../system/idempotency.js';

import { scheduler } from '../system/scheduler.js';
import { metrics } from '../system/metrics.js';

export const tgWorker = new Worker('telegram', async (job) => {
  const { ctx: incomingCtx, payload: data } = job.data;
  const { chatId, text, accountId: requestedAccountId, emotion, stage, userId, leadId, replyTo, span: inputSpan, leadScore } = data || job.data;
  
  const ctx = incomingCtx || createContext(data?.workspaceId || 'tenant_1');
  if (job.id) ctx.jobId = job.id;

  return runWithContext(ctx, async () => {
    // 0. IDEMPOTENCY CHECK
    const idempotencyKey = `tg_job:${ctx.traceId}`;
    if (!(await idempotency.ensure(idempotencyKey))) {
        logger.info({ type: 'tg_worker_skip', reason: 'duplicate_job', key: idempotencyKey, ctx });
        return;
    }

    const span = createSpan('tg_send', inputSpan);
    const start = Date.now();
    metrics.track(ctx, 'tg.send_attempt', 1, { accountId: requestedAccountId });

    // 0.1 LOAD CONTROL & FAIRNESS
    const { loadControl } = await import('../system/loadControl.js');
    const canRun = await loadControl.canExecute(ctx, 'tg_task', { tg_task: 30 });
    if (!canRun) {
        logger.warn({ type: 'tg_worker_delay', reason: 'load_control_throttle', ctx });
        throw new Error('THROTTLE: tenant_capacity_reached');
    }

    // 1. SCHEDULING (Account Selection + Anti-Sync)
    let accountId = requestedAccountId;
    let sendingAccount = null;

    if (accountId === 'main') {
      sendingAccount = { id: 'main' };
    } else {
      const scheduled = await scheduler.scheduleTask(ctx, 'message_send', {
        isReply: !!replyTo,
        leadScore,
        previousAccountId: requestedAccountId
      });

      if (!scheduled) {
        logger.error({ type: 'tg_worker_no_account', ...span });
        throw new Error('no_account_available');
      }

      sendingAccount = scheduled.account;
      accountId = String(sendingAccount.id);

      // Apply the calculated jitter delay
      await new Promise(r => setTimeout(r, scheduled.delay));
    }

    logger.info({ type: 'tg_send_attempt', accountId, chatId, ...span });

  // Send message
  try {
    let finalText = text;
    let finalEmbedding: number[] | null = null;
    
    if (accountId !== 'main') {
      const simCheck = await checkSimilarity(accountId, finalText);
      finalEmbedding = simCheck.embedding;

      if (simCheck.isSimilar) {
        logger.warn({ type: 'antiban_similar_message', similarity: simCheck.similarity, accountId, ...span });
        finalText = mutateText(finalText);
        
        const retryCheck = await checkSimilarity(accountId, finalText);
        if (retryCheck.isSimilar) {
          logger.warn({ type: 'antiban_skipped_message', reason: 'too_similar_after_mutate', accountId, ...span });
          return;
        }
        finalEmbedding = retryCheck.embedding;
      }
      
      // Night Mode Check (Already partially in scheduler/router but double guard)
      const h = new Date().getHours();
      if (h < 8 || h > 23) {
         logger.info({ type: 'antiban_night_mode_block', accountId, ...span });
         return;
      }

      // Adaptive Limits & Readiness
      const allowedToChat = await canSendToChat(accountId, String(chatId));
      if (!allowedToChat) {
         logger.info({ type: 'antiban_chat_limit_hit', accountId, chatId, ...span });
         return; 
      }
      
      const allowed = await canSend(accountId); 
      if (!allowed) {
         logger.warn({ type: 'antiban_account_rate_limit_hit', accountId, ...span });
         throw new Error('limit hit'); 
      }
    }

    const responseType = decideResponseType(stage || 'interest');
    
    if (accountId === 'main') {
      if (process.env.ROLE !== 'userbot') {
        logger.warn({ type: 'userbot_blocked', message: 'Userbot connection block requested outside of userbot process contexts' });
        throw new Error('BLOCKED: Userbot connection only permitted when ROLE=userbot is active.');
      }
      if (process.env.DISABLE_USERBOT === 'true') {
        logger.info({ type: 'userbot_disabled', message: 'Userbot is disabled via DISABLE_USERBOT configuration.' });
        return;
      }
      const client = getClient();
      if (!client.connected) {
         await client.connect();
      }

      // Отмечаем сообщение как прочитанное ПЕРЕД ответом — имитация живого человека.
      // Без этого бот выглядит подозрительно: отвечает без прочтения.
      try {
        await client.markAsRead(chatId);
      } catch (e) {
        console.debug('[tgWorker] markAsRead failed:', e?.message);
      }

      await simulateTyping(client, chatId, finalText.length);

      if (responseType === 'voice') {
          const voiceBuffer = await generateVoice(finalText, emotion);
          if (voiceBuffer) {
              await client.sendFile(chatId, { file: voiceBuffer, voiceNote: true, replyTo });
          } else {
              await client.sendMessage(chatId, { message: finalText, replyTo });
          }
      } else if (responseType === 'video') {
          const videoBuffer = await generateVideoNote(finalText);
          if (videoBuffer) {
              await client.sendFile(chatId, { file: videoBuffer, videoNote: true, replyTo });
          } else {
              await client.sendMessage(chatId, { message: finalText, replyTo });
          }
      } else {
          await client.sendMessage(chatId, { message: finalText, replyTo });
      }
    } else {
      await sendMessageSmart(chatId, finalText, Number(accountId));
      await markAccountUsed(accountId);
      if (finalEmbedding !== null) {
         await saveAccountMessage(accountId, finalText, finalEmbedding);
      }
    }

    logger.info({ type: 'tg_send_success', accountId, chatId, responseType, ...span });

    saveTrainingMessage(String(chatId), String(userId), 'assistant', finalText).catch(e => logger.error({ type: 'training_save_error', error: e.message, ...span }));

    const duration = Date.now() - start;
    metrics.track(ctx, 'tg.send_success', 1, { duration, accountId });

    await crmQueue.add('saveConversation', {
      userId,
      chatId,
      role: 'assistant',
      text: finalText,
      leadId,
      accountId: accountId !== 'main' ? Number(accountId) : undefined,
      span
    }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 }
    });

    } catch (e: any) {
      metrics.track(ctx, 'tg.send_failure', 1, { error: e.message, accountId });
      logger.error({ type: 'tg_send_failed', error: e.message, accountId, chatId, ...span });
      
      let retryDelay = 60000;
      if (accountId !== 'main') {
         const accResult = await handleBanDetection(accountId, e.message, ctx);
         if (accResult.cooldownSeconds > 0) {
           retryDelay = accResult.cooldownSeconds * 1000;
         }
      }
      
      await tgDlq.add('retry', {
        ctx,
        payload: { ...data, accountId }, // Pass the account we tried
        error: e.message,
        failedAt: Date.now(),
        span
      }, {
        delay: Math.min(retryDelay, 600000) // Max 10 mins
      });
    }
  });
}, {
  connection
});
