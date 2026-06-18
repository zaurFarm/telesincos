import { connection, hasRedisUrl } from '../../queue/redis';

export class DistributedRateLimiter {
  static async checkLimit(ip: string, endpoint: string, limit: number, windowMs: number): Promise<boolean> {
     if (!hasRedisUrl || process.env.DISABLE_WORKERS) {
         // Fallback to true if no Redis (e.g. local dev)
         return true;
     }

     const key = `ratelimit:${endpoint}:${ip}`;
     try {
         const current = await connection.incr(key);
         if (current === 1) {
             await connection.pexpire(key, windowMs);
         }
         return current <= limit;
     } catch (e) {
         console.error('[RateLimiter] Error communicating with Redis', e);
         // Fail open if Redis is down to prevent complete outage, 
         // though in strict environments we might fail closed.
         return true; 
     }
  }
}
