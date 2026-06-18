import { Queue } from '../queue/bullmq.js';
import { logger } from './logger.js';
import { crmQueue, aiQueue, tgQueue } from '../queue/index.js';
import { hasRedisUrl } from '../queue/redis.js';

const queues = { crm: crmQueue, ai: aiQueue, tg: tgQueue };
const PRESSURE_CRITICAL_THRESHOLD = 1000;
const PRESSURE_RECOVER_THRESHOLD = 500;

export async function checkQueuePressure() {
  let totalPressure = 0;
  if (!hasRedisUrl) return totalPressure;
  
  for (const [name, queue] of Object.entries(queues)) {
    try {
      const waiting = await queue.getWaitingCount();
      const delayed = await queue.getDelayedCount();
      const failed = await queue.getFailedCount();

      const pressure = waiting * 1 + delayed * 2 + failed * 5;
      totalPressure += pressure;

      if (pressure > PRESSURE_CRITICAL_THRESHOLD && !queue.isPaused) {
        logger.warn({ type: 'queue_pressure', message: `Queue ${name} pressure critical (${pressure}). Pausing.`, pressure });
        await queue.pause();
      } else if (pressure < PRESSURE_RECOVER_THRESHOLD && queue.isPaused) {
        logger.info({ type: 'queue_pressure_recovery', message: `Queue ${name} pressure dropped (${pressure}). Resuming.`, pressure });
        await queue.resume();
      }
    } catch (err) {
      logger.error({ type: 'queue_pressure_error', message: `Failed to check pressure on ${name}`, error: err });
    }
  }
  
  return totalPressure;
}
