import { aiWorker } from './aiWorker.js';
import { tgWorker } from './tgWorker.js';
import { crmWorker } from './crmWorker.js';
import { retryWorker } from './retryWorker.js';
import { startFollowupWorker } from './followupWorker.js';
import { startExperimentWorker } from './experimentWorker.js';
import { startLogAnalyzer } from './logAnalyzerWorker.js';
import { startSystemWorker } from './systemWorker.js';
import { startCronJobs } from '../system/cron.js';
import { logger } from '../system/logger.js';

let lastRedisError = 0;

export async function startWorkers() {
  [aiWorker, tgWorker, crmWorker, retryWorker].forEach(worker => {
    worker.on('error', err => {
      if (err.message.includes('ECONNREFUSED')) {
         const now = Date.now();
         if (now - lastRedisError > 60000) { // Log at most once per minute
           logger.warn({ type: 'worker_redis_error', message: 'Redis connection refused. Please ensure REDIS_URL is set and Redis is running.' });
           lastRedisError = now;
         }
         return;
      }
      logger.error({ type: 'worker_error', message: err.message, stack: err.stack });
    });
  });

  startFollowupWorker();
  startExperimentWorker();
  startLogAnalyzer();
  startSystemWorker();
  startCronJobs();

  logger.info({ type: 'system_startup', message: '👷 Workers initialized (AI, TG, CRM, DLQ, Followups, Experiments, LogAnalyzer, Cron)' });
}
