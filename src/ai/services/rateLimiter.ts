import { connection } from '../../queue/redis.js';

// User should not receive an AI reply more than once per `intervalMs`
const DEFAULT_RATE_LIMIT_MS = 20000; 

export async function isRateLimited(userId: string | number, intervalMs = DEFAULT_RATE_LIMIT_MS): Promise<boolean> {
  const key = `ratelimit:ai:${userId}`;
  
  try {
    const lastReply = await connection.get(key);
    const now = Date.now();
    
    if (lastReply) {
      if (now - parseInt(lastReply, 10) < intervalMs) {
        return true; 
      }
    }
    
    await connection.set(key, now.toString(), 'EX', Math.ceil(intervalMs / 1000));
    return false;
  } catch (error) {
    console.error('⚠️ RateLimiter Redis Error, allowing request safely.', error);
    return false;
  }
}

export async function enforceRateLimit(userId: string | number) {
  if (await isRateLimited(userId)) {
    throw new Error('AI_RATE_LIMIT_EXCEEDED');
  }
}
