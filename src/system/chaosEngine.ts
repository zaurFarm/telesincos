import { logger } from './logger.js';
import { crmQueue } from '../queue/index.js';

export class ChaosEngine {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.ENABLE_CHAOS === 'true';
  }

  async simulateRedisLatency() {
    if (!this.enabled) return;
    logger.warn({ type: 'chaos', message: 'Simulating Redis latency' });
    return new Promise(resolve => setTimeout(resolve, 5000));
  }

  simulateWorkerCrash() {
    if (!this.enabled) return;
    logger.error({ type: 'chaos', message: 'Simulating worker crash' });
    throw new Error('CHAOS_TEST_WORKER_CRASH');
  }

  async simulateQueueFlood() {
    if (!this.enabled) return;
    logger.warn({ type: 'chaos', message: 'Simulating queue flood' });
    for (let i = 0; i < 5000; i++) {
       crmQueue.add('fake_job', { chaos: true });
    }
  }
}

export const chaosEngine = new ChaosEngine();
