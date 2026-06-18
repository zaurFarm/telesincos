import { logger } from './logger.js';
import { db } from '../db.js';

export interface AIStrategy {
  id: string;
  tone: "friendly" | "neutral" | "direct";
  length: "short" | "medium" | "long";
  delay: number;
  aggressiveness: number;
}

export const STRATEGIES: Record<string, AIStrategy> = {
  safe: {
    id: 'safe',
    tone: 'neutral',
    length: 'short',
    delay: 3000,
    aggressiveness: 0.2
  },
  balanced: {
    id: 'balanced',
    tone: 'friendly',
    length: 'medium',
    delay: 1500,
    aggressiveness: 0.5
  },
  aggressive: {
    id: 'aggressive',
    tone: 'direct',
    length: 'short',
    delay: 500,
    aggressiveness: 0.9
  }
};

let currentStrategyId = 'balanced';
let lastSwitchTime = Date.now();

export function getCurrentStrategy(): AIStrategy {
  return STRATEGIES[currentStrategyId];
}

export function getCurrentStrategyId() {
  return currentStrategyId;
}

export function switchStrategy(newStrategyId: string, reason: string = 'manual') {
  if (currentStrategyId === newStrategyId) return;
  if (!STRATEGIES[newStrategyId]) return;

  const now = Date.now();
  if (now - lastSwitchTime < 60000 && reason !== 'manual') {
    logger.info({ type: 'strategy_switch_blocked', reason: 'changed_too_recently' });
    return;
  }
  
  logger.info({
    type: 'strategy_changed',
    from: currentStrategyId,
    to: newStrategyId,
    reason
  });
  
  currentStrategyId = newStrategyId;
  lastSwitchTime = now;
}

export async function evaluateStrategy() {
  // Check metrics to auto-switch
  try {
    const res = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM system_logs WHERE type = 'ban' AND created_at > NOW() - INTERVAL '1 hour') as bans_1h,
        (SELECT COUNT(*) FROM conversations WHERE role = 'user' AND created_at > NOW() - INTERVAL '1 hour') as replies_1h
    `);
    
    if (res.rows.length === 0) return;
    
    const bans = parseInt(res.rows[0].bans_1h) || 0;
    const replies = parseInt(res.rows[0].replies_1h) || 0;

    if (bans > 5) {
      // Need safe mode
      switchStrategy('safe', 'auto_ban_spike');
    } else if (bans === 0 && replies < 5) {
      // No bans, few replies, let's be more aggressive
      switchStrategy('aggressive', 'auto_low_reply_rate');
    } else {
      // Normal
      switchStrategy('balanced', 'auto_balanced');
    }
  } catch (e: any) {
    if (e.code !== 'ECONNREFUSED' && !e.message?.includes('ECONNREFUSED')) {
      logger.error({ type: 'strategy_evaluate_error', error: String(e) });
    }
  }
}
