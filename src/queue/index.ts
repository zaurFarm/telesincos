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

[aiQueue, tgQueue, tgDlq, crmQueue].forEach(queue => {
  queue.on('error', err => {
    // console.error('[Queue Error]', err.message);
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
