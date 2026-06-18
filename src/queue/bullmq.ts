import { Queue as BullQueue, Worker as BullWorker } from 'bullmq';
import { hasRedisUrl } from './redis.js';
import { MockQueue, MockWorker } from './mock.js';

export const Queue = (hasRedisUrl ? BullQueue : MockQueue) as any;
export const Worker = (hasRedisUrl ? BullWorker : MockWorker) as any;
