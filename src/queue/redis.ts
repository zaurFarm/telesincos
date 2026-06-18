import IORedis from 'ioredis';
import dotenv from 'dotenv';
dotenv.config();

export const hasRedisUrl = !!process.env.REDIS_URL;

if (process.env.IS_WORKER === 'true' && !hasRedisUrl) {
  console.error('FATAL: REDIS_URL is required when IS_WORKER=true.');
  process.exit(1);
}

if (process.env.NODE_ENV === 'production' && !hasRedisUrl) {
  console.error('FATAL: REDIS_URL is required in production.');
  process.exit(1);
}

if (!hasRedisUrl && !process.env.DISABLE_WORKERS) {
  console.warn('⚠️ WARNING: REDIS_URL is not set. Workers will be disabled in this process automatically to prevent BullMQ crashes with missing Redis.');
  process.env.DISABLE_WORKERS = 'true';
}

export const connection = process.env.REDIS_URL ? 
  new IORedis(process.env.REDIS_URL, { 
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      const delay = Math.min(times * 1000, 10000);
      return delay;
    }
  }) 
  : null as unknown as IORedis;

if (connection) {
  connection.on('error', (err: any) => {
    // Prevent unhandled exception crashes by catching redis connection errors
  });
  console.log('🔗 Redis client initialized.');
} else {
  console.log('ℹ️ Redis client disabled (DISABLE_WORKERS=true).');
}
