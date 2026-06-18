import { aiWorker } from '../../src/workers/aiWorker.js';
import { tgWorker } from '../../src/workers/tgWorker.js';
import { crmWorker } from '../../src/workers/crmWorker.js';
import { retryWorker } from '../../src/workers/retryWorker.js';
import { startFollowupWorker } from '../../src/workers/followupWorker.js';
import { startExperimentWorker } from '../../src/workers/experimentWorker.js';
import { startLogAnalyzer } from '../../src/workers/logAnalyzerWorker.js';
import { startSystemWorker } from '../../src/workers/systemWorker.js';
import { logger } from '../../src/system/logger.js';
import { startMemoryWatchdog } from '../../src/system/memoryManager.js';
import { processFailedJob } from '../../src/system/poisonJobTracker.js';

import { registerShutdownHook, setupGracefulShutdown } from '../../src/system/shutdown.js';

console.log('[WORKERS] Booting process...');

let lastRedisError = 0;

export async function bootstrap() {
  try {
    setupGracefulShutdown('WORKERS', 20000);

    startMemoryWatchdog();

    const allWorkers = [aiWorker, crmWorker, retryWorker];

    // tgWorker is now managed by userbot role to isolate MTProto
    // But we still close the ones we manage here
    registerShutdownHook(async () => {
      console.log('[WORKERS] Pausing workers for shutdown drain...');
      await Promise.all(allWorkers.map(w => w.close()));
      try {
        const { aiQueue, tgQueue, crmQueue, tgDlq } = await import('../../src/queue/index.js');
        await Promise.all([
          aiQueue.close(),
          tgQueue.close(),
          crmQueue.close(),
          tgDlq.close()
        ]);
        console.log('[WORKERS] All queues closed safely.');
      } catch (e) {
        console.error('[WORKERS] Error closing queues', e);
      }
    });

    allWorkers.forEach(worker => {
      worker.on('error', err => {
        if (err.message.includes('ECONNREFUSED')) {
           const now = Date.now();
           if (now - lastRedisError > 60000) { 
             logger.warn({ type: 'worker_redis_error', message: 'Redis connection refused.' });
             lastRedisError = now;
           }
           return;
        }
        logger.error({ type: 'worker_error', message: err.message, stack: err.stack });
      });

      worker.on('failed', async (job, err) => {
        if (job) {
          await processFailedJob(job, err);
        }
      });
    });

    startFollowupWorker();
    startExperimentWorker();
    startLogAnalyzer();
    startSystemWorker();

    logger.info({ type: 'process_startup', message: '👷 Workers process running.' });
  } catch (err) {
    console.error('Failed to start workers', err);
    process.exit(1);
  }
}

bootstrap();
