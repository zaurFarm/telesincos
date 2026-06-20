import { Queue } from './bullmq.js';
import { connection } from './redis.js';

const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
  removeOnComplete: 1000,
  removeOnFail: 5000,
};

export const aiQueue = new Queue('ai', { connection, defaultJobOptions });
export const tgQueue = new Queue('telegram', { connection, defaultJobOptions });
export const tgDlq = new Queue('telegram_dlq', { connection });
export const crmQueue = new Queue('crm', { connection, defaultJobOptions });

const _queueErrLast: Record<string, number> = {};
[aiQueue, tgQueue, tgDlq, crmQueue].forEach((queue, idx) => {
  queue.on('error', err => {
    // Rate-limit: log at most once per 30s per queue to avoid log floods on Redis outage
    const now = Date.now();
    const key = String(idx);
    if (!_queueErrLast[key] || now - _queueErrLast[key] > 30000) {
      _queueErrLast[key] = now;
      console.error('[Queue Error]', err?.message || err);
    }
  });
});

import { registerShutdownHook } from '../system/shutdown.js';
registerShutdownHook(async () => {
  console.log('[Queue] Closing queues...');
  await Promise.all([
    aiQueue.close(),
    tgQueue.close(),
    tgDlq.close(),
    crmQueue.close()
  ]);
  console.log('[Queue] Queues closed.');
});
