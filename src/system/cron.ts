import { crmQueue, tgQueue, aiQueue } from '../queue/index.js';
import { bootAllListeners } from '../traffic/orchestrator.js';
import { acquireLock, releaseLock } from './locks.js';
import { logger } from './logger.js';

let intervals: NodeJS.Timeout[] = [];

async function enqueueWithLock(taskName: string, queue: any, queueArg: any) {
  const locked = await acquireLock(`cron_${taskName}`, 30000); // 30s lock
  if (locked) {
    try {
      await queue.add(taskName, queueArg);
    } finally {
      // we intentionally expire the lock instead of immediate release if we want to ensure no other cron picks it up in a short window
    }
  }
}

import { autoJoinVapeChannels } from '../jobs/autoJoinChannels.js';


export async function startCronJobs() {
  bootAllListeners().catch((e: any) => {
     if (e.code !== 'ECONNREFUSED' && !e.message?.includes('ECONNREFUSED')) {
       logger.error({ type: 'cron_boot_error', error: String(e) });
     }
  });

  intervals.push(setInterval(() => enqueueWithLock('retarget', crmQueue, {}), 60 * 60 * 1000));
  intervals.push(setInterval(() => enqueueWithLock('warmup', crmQueue, {}), 30 * 60 * 1000));
  intervals.push(setInterval(() => enqueueWithLock('autopost', crmQueue, {}), 30 * 60 * 1000));
  intervals.push(setInterval(() => enqueueWithLock('traffic', crmQueue, {}), 2 * 60 * 60 * 1000));
  intervals.push(setInterval(() => enqueueWithLock('reset_limits', crmQueue, {}), 60 * 60 * 1000));
  intervals.push(setInterval(() => enqueueWithLock('knowledge_update', crmQueue, {}), 6 * 60 * 60 * 1000));
  intervals.push(setInterval(() => enqueueWithLock('slo_check', crmQueue, {}), 5 * 60 * 1000));
  intervals.push(setInterval(() => enqueueWithLock('market_scan', crmQueue, {}), 30 * 60 * 1000));

  intervals.push(setInterval(() => autoJoinVapeChannels().catch((e: any) => logger.error({ type: 'autojoin_error', error: String(e) })), 24 * 60 * 60 * 1000));
  // Initial enqueues for immediate startup
  autoJoinVapeChannels().catch((e: any) => logger.error({ type: 'autojoin_error', error: String(e) }));
  enqueueWithLock('warmup', crmQueue, {});
  enqueueWithLock('traffic', crmQueue, {});
  enqueueWithLock('knowledge_update', crmQueue, {});
  enqueueWithLock('slo_check', crmQueue, {});
  enqueueWithLock('market_scan', crmQueue, {});
}

export function stopCronJobs() {
  logger.info({ type: 'cron_shutdown', message: 'Stopping all cron intervals' });
  intervals.forEach(clearInterval);
  intervals = [];
}