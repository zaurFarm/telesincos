import { connection as redisLockClient, hasRedisUrl } from '../queue/redis.js';
import { logger } from './logger.js';

export { redisLockClient };

const localLocks = new Map<string, number>();

export async function acquireLock(key: string, ttlMs = 30000): Promise<boolean> {
  if (!redisLockClient) {
    const now = Date.now();
    const expiry = localLocks.get(key);
    if (!expiry || now > expiry) {
      localLocks.set(key, now + ttlMs);
      return true;
    }
    return false;
  }

  try {
    const result = await redisLockClient.set(key, '1', 'PX', ttlMs, 'NX');
    return result === 'OK'; // OK if max, null if already exists
  } catch (err) {
    logger.error({ type: 'lock_error', msg: `Failed to acquire lock ${key}`, error: err });
    return false;
  }
}

export async function releaseLock(key: string): Promise<void> {
  if (!redisLockClient) {
    localLocks.delete(key);
    return;
  }

  try {
    await redisLockClient.del(key);
  } catch (err) {
    logger.error({ type: 'lock_error', msg: `Failed to release lock ${key}`, error: err });
  }
}
