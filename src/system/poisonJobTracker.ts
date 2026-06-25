import { logger } from './logger.js';
import { tgDlq } from '../queue/index.js';

export async function processFailedJob(job: any, err: Error) {
  if (job.attemptsMade >= job.opts.attempts) {
    logger.error({ type: 'poison_job', message: `Job ${job.id} failed permanently, moving to DLQ.`, error: err.message, stack: err.stack });
    try {
      await tgDlq.add('poison', { originalJob: job.data, originalError: err.message }, { removeOnComplete: false });
    } catch (e) {
      logger.error({ type: 'dlq_error', message: 'Failed to push into DLQ', error: e });
    }
  }
}
