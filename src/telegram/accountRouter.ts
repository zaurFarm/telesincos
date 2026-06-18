import { db } from '../db.js';
import { calculateHealth, getHealthTier } from '../antiban/accountHealth.js';
import { logger } from '../system/logger.js';

import { transitionAccountState, AccountState } from '../system/stateMachine.js';
import { getContext, AppContext } from '../system/context.js';

interface PickAccountOptions {
  isColdLead?: boolean;
  isReply?: boolean;
  chatType?: 'private' | 'group';
  riskLevel?: 'high' | 'medium' | 'low';
  workspaceId?: string;
  previousAccountId?: string;
  leadScore?: number;
  tenantPressure?: number;
}

function getDailyLimit(account: any) {
  switch (account.warmup_stage) {
    case 'new': return 5;
    case 'warming': return 15;
    case 'active': return 40;
    case 'trusted': return 80;
    default: return 10;
  }
}

export async function pickAccount(opts: PickAccountOptions) {
  const chatType = opts.chatType || 'private';
  const hour = new Date().getHours();
  if (hour < 8 || hour > 23) {
    if (Math.random() > 0.1) {
      console.log('🌙 Night Mode active: Skipping account picking to rest accounts.');
      return null;
    }
  }

  const tenantId = opts.workspaceId || 'tenant_1';

  // If it's a continuing conversation, keep the same account
  if (opts.isReply && opts.previousAccountId) {
    const res = await db.withTenant(tenantId, async (client) => {
      return await client.query(`
        SELECT * FROM farm_accounts
        WHERE id = $1 AND state IN ('ACTIVE', 'WARMING_UP')
          AND (cooldown_until IS NULL OR cooldown_until < NOW())
      `, [opts.previousAccountId]);
    });
    
    if (res.rows.length > 0) {
      const acc = res.rows[0];
      if (acc.sent_today < getDailyLimit(acc)) {
        if (opts.isReply && acc.role !== 'hunter') return acc; // hybrid or responder
      }
    }
  }

  // Select all active
  const result = await db.withTenant(tenantId, async (client) => {
    return await client.query(`
      SELECT * FROM farm_accounts 
      WHERE state IN ('ACTIVE', 'WARMING_UP') 
        AND (cooldown_until IS NULL OR cooldown_until < NOW())
    `);
  });

  const { riskEngine } = await import('../system/riskEngine.js');
  
  const validAccounts = [];

  for (const acc of result.rows) {
    // 1. Proxy Reputation Check (Risk v2)
    const proxyHealth = await riskEngine.evaluateProxyHealth(acc.proxy);
    if (proxyHealth < 0.4) {
      // Account is on a toxic proxy, skip it even if it's technically fine
      continue;
    }
    // Specialized Lead Scoring Routing
    // If the lead is hot (score > 4), we want a reliable 'responder' or 'hybrid'. 
    if (opts.leadScore && opts.leadScore > 4) {
       if (acc.role === 'hunter') continue; 
    }

    // Proactive / initiate limits
    if (opts.isColdLead && acc.role === 'responder') continue;
    
    // Reply limits
    if (opts.isReply && acc.role === 'hunter') continue;
    
    // Safety
    if (opts.isColdLead && acc.role === 'hunter') {
      if (acc.sent_today > 10) continue;
      if (acc.trust_score < 20) continue;
    }

    if (acc.sent_today >= getDailyLimit(acc)) continue;

    validAccounts.push(acc);
  }
  
  if (validAccounts.length === 0) {
      return null;
  }

  // Sort by comprehensive score
  validAccounts.sort((a, b) => {
      const getScore = (acc: any) => {
        const health = acc.health_score || 80;
        const usageRate = (acc.sent_today / (acc.daily_limit || 10)) * 50;
        const floodRisk = (acc.flood_count || 0) * 15;
        const trustBonus = (acc.trust_score || 0) * 0.5;
        const warmupBonus = acc.state === 'WARMING_UP' ? 10 : 0;
        
        // Tenant pressure penalty
        const pressurePenalty = (opts.tenantPressure || 0) > 10 && trustBonus > 20 ? 10 : 0;

        return health - usageRate - floodRisk + warmupBonus + trustBonus - pressurePenalty;
      };

      return getScore(b) - getScore(a);
  });

  return validAccounts[0];
}

export async function markAccountUsed(accountId: string) {
  const ctx = getContext();
  if (ctx) {
    await db.withTenant(ctx.tenantId, async (client) => {
      await client.query(`
        UPDATE farm_accounts 
        SET sent_today = sent_today + 1, last_used_at = NOW()
        WHERE id = $1
      `, [accountId]);
    });
  } else {
    await db.query(`
      UPDATE farm_accounts 
      SET sent_today = sent_today + 1, last_used_at = NOW()
      WHERE id = $1
    `, [accountId]);
  }
}

export async function handleBanDetection(accountId: string, errorMsg: string, ctx?: AppContext) {
  const activeCtx = ctx || getContext();
  if (!activeCtx) throw new Error("No context for ban detection");

  let nextState: AccountState = 'ACTIVE';
  let reason = 'error_analysis';
  let cooldownSeconds = 0;

  if (errorMsg.includes('FLOOD_WAIT') || errorMsg.includes('PEER_FLOOD')) {
    nextState = 'COOLING_DOWN'; 
    reason = 'flood_wait';
    
    const waitMatch = errorMsg.match(/wait of (\d+) seconds/i) || errorMsg.match(/(\d+) seconds/i);
    if (waitMatch && waitMatch[1]) {
      cooldownSeconds = parseInt(waitMatch[1], 10);
    } else {
      cooldownSeconds = 300; 
    }

  } else if (errorMsg.includes('AUTH_KEY_UNREGISTERED') || errorMsg.includes('BANNED') || errorMsg.includes('DEACTIVATED')) {
    nextState = 'BANNED'; 
    reason = 'telegram_ban';
  } else if (errorMsg.includes('limit')) {
    nextState = 'LIMITED';
    reason = 'rate_limit';
    cooldownSeconds = 3600;
  } else if (errorMsg.includes('USER_DEACTIVATED_BAN')) {
    nextState = 'SUSPENDED';
    reason = 'deactivated_ban';
  }

  const accRes = await db.withTenant(activeCtx.tenantId, async (client) => {
    return await client.query(`SELECT flood_count, state FROM farm_accounts WHERE id = $1`, [accountId]);
  });
  
  const current = accRes.rows[0];
  const currentFloodCount = current ? current.flood_count || 0 : 0;
  
  if (nextState === 'COOLING_DOWN') {
     if (currentFloodCount + 1 >= 5) {
        cooldownSeconds = Math.max(cooldownSeconds, 86400); // 24 hours quarantine
        nextState = 'QUARANTINED' as AccountState;
        reason = 'consecutive_floods';
     }
  }

  if (nextState !== 'ACTIVE') {
    try {
      await transitionAccountState(activeCtx, accountId, nextState, reason);
      
      if (cooldownSeconds > 0) {
        await db.withTenant(activeCtx.tenantId, async (client) => {
          await client.query(`
            UPDATE farm_accounts 
            SET cooldown_until = NOW() + interval '1 second' * $1,
                flood_count = flood_count + 1,
                trust_score = GREATEST(trust_score - 10, 0)
            WHERE id = $2
          `, [cooldownSeconds, accountId]);
        });
      } else if (nextState === 'BANNED' || nextState === 'QUARANTINED') {
         await db.withTenant(activeCtx.tenantId, async (client) => {
          await client.query(`UPDATE farm_accounts SET trust_score = 0 WHERE id = $1`, [accountId]);
        });
      }
    } catch (err: any) {
      logger.error({ type: 'transition_failed', error: err.message, accountId, nextState });
    }
  }

  // 1. GLOBAL LIMITER AUTO-SHUTDOWN CHECK
  const { checkAutoShutdown } = await import('../system/limiter.js');
  await checkAutoShutdown();

  // 2. RISK ENGINE PREDICTION
  const { riskEngine } = await import('../system/riskEngine.js');
  await riskEngine.evaluateAccountRisk(accountId);

  return { cooldownSeconds, status: nextState };
}
