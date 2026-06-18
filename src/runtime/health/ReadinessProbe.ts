import { hasRedisUrl, connection } from '../../queue/redis.js';
import { db } from '../../db.js';

export class ReadinessProbe {
  static async check() {
    const checks: Record<string, boolean | string> = {
      api: true,
      redis: false,
      postgres: false,
      queues: true
    };
    
    // Check Redis connection if enabled
    if (hasRedisUrl) {
      try {
        const IORedis = (await import('ioredis')).default;
        const testConn = new IORedis(process.env.REDIS_URL!, { connectTimeout: 2000, lazyConnect: true });
        await testConn.connect();
        const ping = await testConn.ping();
        await testConn.quit();
        checks.redis = ping === 'PONG';
      } catch (e: any) {
        checks.redis = false;
        checks.redis_error = e.message;
      }
    } else {
      if (process.env.NODE_ENV === 'production') {
        checks.redis = false;
        checks.redis_error = 'REDIS_URL is strictly required in production';
      } else {
        checks.redis = 'mock'; // Indicate we are running in mock mode
      }
    }

    // Check PostgreSQL
    try {
      await Promise.race([
        db.query('SELECT 1'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('PostgreSQL timeout')), 3000))
      ]);
      checks.postgres = true;
    } catch (e: any) {
      checks.postgres = false;
      checks.postgres_error = e.message;
    }

    // Check BullMQ queues
    try {
      const { aiQueue } = await import('../../queue/index.js');
      await Promise.race([
        aiQueue.getJobCounts('wait'),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Queue counts timeout')), 3000))
      ]);
      checks.queues = true;
    } catch (e: any) {
      checks.queues = false;
      checks.queues_error = e.message;
    }

    const isReady = Object.values(checks).every(v => 
      v === true || (v === 'mock' && process.env.NODE_ENV !== 'production')
    );
    return { isReady, checks };
  }
}
