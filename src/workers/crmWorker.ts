import { Worker } from '../queue/bullmq.js';
import { connection } from '../queue/redis.js';
import { db } from '../db.js';
import { saveConversation, logAction } from '../../server.js';
import { processRetargeting } from '../telegram/retargetJob.js';
import { runWarmupCycle } from '../farm/warmupEngine.js';
import { runTraffic } from '../traffic/engine.js';
import { resetLimits } from '../farm/accountManager.js';
import { runKnowledgeUpdate } from '../knowledge/updater.js';
import { calculateDynamicLimit } from '../antiban/limits.js';
import { runAutopost } from '../autopost/engine.js';
import { checkSLOs } from '../system/sloManager.js';
import { TelegramMarketScanner } from '../engines/market/scanner/TelegramMarketScanner.js';

export const crmWorker = new Worker('crm', async (job) => {
  if (job.name === 'saveConversation') {
    const { userId, chatId, role, text, leadId, accountId } = job.data;
    await saveConversation(userId, chatId, role, text, leadId, accountId);
    
    await db.query(
      `INSERT INTO actions (type, chat, user_name, content, reason) VALUES ($1, $2, $3, $4, $5)`,
      ['reply', chatId, userId, text, 'ai_generated']
    );
  }

  if (job.name === 'retarget') {
    await processRetargeting();
  }

  if (job.name === 'warmup') {
    await runWarmupCycle();
  }

  if (job.name === 'autopost') {
    await runAutopost();
  }

  if (job.name === 'traffic') {
    await runTraffic();
  }

  if (job.name === 'knowledge_update') {
    await runKnowledgeUpdate();
    await calculateDynamicLimit();
  }

  if (job.name === 'slo_check') {
    await checkSLOs();
  }

  if (job.name === 'market_scan') {
    const found = await TelegramMarketScanner.scanChannels();
    if (found.length > 0) {
      await db.query(
        `INSERT INTO actions (type, chat, user_name, content, reason) VALUES ($1, $2, $3, $4, $5)`,
        ['market_scan', 'system', 'scanner', `Found ${found.length} competitor offers`, 'scheduled_scan']
      );
    }
  }

  if (job.name === 'reset_limits') {
    await resetLimits();
  }

}, { connection, concurrency: 5 });
