import { aiQueue, tgQueue, crmQueue, tgDlq } from '../../queue/index.js';
import { RuntimeTelemetryBus } from './RuntimeTelemetryBus.js';
import { hasRedisUrl } from '../../queue/redis.js';

export class QueueTelemetryCollector {
  private intervalId?: NodeJS.Timeout;

  start(intervalMs: number = 2000) {
    if (!hasRedisUrl) return; // Skip if no real queue
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.intervalId = setInterval(() => this.collect(), intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private async collect() {
    try {
      const queues = {
        ai: aiQueue,
        tg: tgQueue,
        crm: crmQueue,
        dlq: tgDlq
      };

      for (const [name, queue] of Object.entries(queues)) {
        const counts = await queue.getJobCounts('wait', 'active', 'completed', 'failed', 'delayed');
        
        RuntimeTelemetryBus.emit({
          id: `queue_depth_${name}_${Date.now()}`,
          type: 'QUEUE_DEPTH_CHANGED',
          timestamp: Date.now(),
          source: `bullmq_${name}`,
          payload: {
            queue: name,
            counts
          }
        });
      }
    } catch (err) {
      console.error('[QueueTelemetryCollector] Error collecting queue stats', err);
    }
  }
}

export const globalQueueTelemetry = new QueueTelemetryCollector();
