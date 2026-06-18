import { Worker } from '../queue/bullmq.js';
import { connection } from '../queue/redis.js';
import { tgQueue } from '../queue/index.js';

export const retryWorker = new Worker('telegram_dlq', async (job) => {
  const { error, failedAt, ...originalPayload } = job.data;

  // We can add logic here: limit max specific DLQ retries
  const dlqAttempts = job.attemptsMade || 0;
  
  if (dlqAttempts > 5) {
    console.error(`[DLQ] Message completely failed after 5 retries. Dropping:`, originalPayload);
    // You could also save this terminal failure to DB
    return;
  }

  console.log(`[DLQ] Retrying failed message for ${originalPayload.chatId} (Attempt: ${dlqAttempts + 1})`);
  
  // Re-push to main TG queue to attempt sending again
  await tgQueue.add('sendMessage', originalPayload, {
    delay: 5000, 
    attempts: 1 // Attempt once on main queue, if fails back to DLQ
  });

}, { connection });
