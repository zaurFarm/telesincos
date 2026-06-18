import { connection as redis } from '../queue/redis.js';

export async function canSend(accountId: string) {
  let tier = 'yellow';
  let limit = 3;

  try {
    const { db } = await import('../db.js');
    const { calculateHealth, getHealthTier } = await import('./accountHealth.js');
    
    const res = await db.query(`SELECT status, flood_count, created_at, errors_count FROM farm_accounts WHERE id = $1`, [accountId]);
    if (res.rows.length > 0) {
      const acc = res.rows[0];
      
      // Account health system (P2)
      if (acc.errors_count > 10) {
          await db.query(`UPDATE farm_accounts SET status = 'cooldown', errors_count = 0 WHERE id = $1`, [accountId]);
          return false; // Force cooldown
      }

      tier = getHealthTier(calculateHealth(acc));
      
      // Adaptive age limit (P2)
      const ageDays = (new Date().getTime() - new Date(acc.created_at || new Date()).getTime()) / (1000 * 3600 * 24);
      
      if (ageDays < 3) {
        limit = 5; // e.g. 5 per hour or minute depending on sliding window
      } else {
        const limitMap: Record<string, number> = { green: 20, yellow: 10, red: 3 };
        limit = limitMap[tier] || 3;
      }
    }
  } catch(e) {
    // fallback
  }

  const key = `tg:acct:${accountId}:min`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, 60);
  }

  return current <= limit;
}

export async function canSendToChat(accountId: string, chatId: string) {
  const key = `tg:acct:${accountId}:chat:${chatId}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, 30); // 30 sec window
  }

  return current <= 3;
}

export async function canDoProactive(accountId: string) {
  // Account/System proactive kill-switch
  try {
    const { db } = await import('../db.js');
    
    // Global checking
    const res = await db.query(`
      SELECT 
        SUM(sent_today) as total_sent,
        SUM(block_events) as total_blocks
      FROM farm_accounts
    `);
    const sent = parseInt(res.rows[0]?.total_sent || '0');
    const blocks = parseInt(res.rows[0]?.total_blocks || '0');
    const banRate = sent > 20 ? blocks / sent : 0;
    
    // Single account risk checking
    const { riskEngine } = await import('../system/riskEngine.js');
    const abuseScore = await riskEngine.evaluateAccountRisk(accountId);

    // Kill switch if global ban rate > 10% or account abuse score is too high
    if (banRate > 0.1 || abuseScore > 0.7) {
      return false;
    }
  } catch(e) {
    // Ignore db err, fallback to standard limits
  }

  const key = `tg:acct:${accountId}:proactive:day`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, 86400); // 1 day
  }

  return current <= 20;
}
