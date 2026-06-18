import { EventEmitter } from 'events';
import { logger } from '../system/logger.js';

export class MockQueue extends EventEmitter {
  constructor(public name: string, options?: any) { super(); }
  async add(name: string, data: any, opts?: any) {
    const job = { id: Math.random().toString(), data };
    
    // In-memory processing simulation
    setTimeout(() => {
        globalContextMockWorkers?.[this.name]?.(job).catch((e: any) => {
            logger.error({ type: 'mock_worker_error', message: e.message });
        });
    }, 100);

    return job;
  }
  async getWaitingCount() { return 0; }
  async getDelayedCount() { return 0; }
  async getFailedCount() { return 0; }
  async getJobCounts(...args: string[]) {
    return { wait: 0, active: 0, delayed: 0, completed: 0, failed: 0 };
  }
  async pause() {}
  async resume() {}
  async close() {}
  isPaused = false;
}

const globalContextMockWorkers: Record<string, Function> = {};

export class MockWorker extends EventEmitter {
  constructor(public name: string, public processor: (job: any) => Promise<any>, options?: any) {
    super();
    globalContextMockWorkers[name] = processor;
  }
}
