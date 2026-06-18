import { db } from '../db.js';
import { logger } from './logger.js';

/**
 * Risk Scoring Engine v2
 * Provides deep analysis of account and infrastructure health.
 */
export const riskEngine = {
  /**
   * Evaluate if a specific proxy is "toxic" based on recent ban history.
   */
  async evaluateProxyHealth(proxy: string) {
    if (!proxy) return 1.0; // No proxy, assume neutral

    const res = await db.query(`
      SELECT 
        COUNT(*) as total_accounts,
        SUM(CASE WHEN state = 'BANNED' THEN 1 ELSE 0 END) as ban_count,
        SUM(CASE WHEN state = 'COOLING_DOWN' THEN 1 ELSE 0 END) as cooling_count
      FROM farm_accounts 
      WHERE proxy = $1
    `, [proxy]);

    const stats = res.rows[0];
    const banRate = Number(stats.ban_count) / (Number(stats.total_accounts) || 1);
    
    // If more than 20% of accounts on this proxy are banned, it's toxic
    if (banRate > 0.2 || Number(stats.ban_count) >= 2) {
      return 0.2; // Critical low health
    }

    return Math.max(0.2, 1.0 - (banRate * 2));
  },

  async getAllProxiesHealth() {
    const res = await db.query(`
      SELECT 
        proxy,
        COUNT(*) as total_accounts,
        SUM(CASE WHEN state = 'BANNED' THEN 1 ELSE 0 END) as ban_count,
        SUM(CASE WHEN state = 'ACTIVE' THEN 1 ELSE 0 END) as active_count,
        SUM(CASE WHEN state = 'COOLING_DOWN' THEN 1 ELSE 0 END) as cooling_count
      FROM farm_accounts 
      WHERE proxy IS NOT NULL AND proxy != ''
      GROUP BY proxy
    `);

    return res.rows.map(row => {
      const banRate = Number(row.ban_count) / (Number(row.total_accounts) || 1);
      let health = Math.max(0.2, 1.0 - (banRate * 2));
      let status = 'HEALTHY';
      if (health < 0.4) status = 'TOXIC';
      else if (health < 0.7) status = 'SUSPICIOUS';

      return {
        ...row,
        health,
        status
      };
    });
  },

  async evaluateAccountRisk(accountId: string | number) {
    try {
      const res = await db.query(`SELECT * FROM farm_accounts WHERE id=$1`, [accountId]);
      if (res.rows.length === 0) return 0;
      
      const account = res.rows[0];
      const proxyHealth = await this.evaluateProxyHealth(account.proxy);
      
      const limit = account.daily_limit || 50;
      const frequencyFactor = Math.min(account.sent_today / limit, 1);
      const floodFactor = Math.min((account.flood_count || 0) / 5, 1);
      const blockFactor = Math.min((account.block_events || 0) / 3, 1);
      
      // Aggregate Score: high = higher risk
      const behaviorRisk = (floodFactor * 0.4) + (frequencyFactor * 0.3) + (blockFactor * 0.3);
      
      // Final health is behavior risk modified by infrastructure (proxy) health
      const finalRisk = behaviorRisk + (1 - proxyHealth) * 0.5;
      
      if (finalRisk > 0.7 && account.state === 'ACTIVE') {
          const cooldownHours = 6;
          await db.query(`
            UPDATE farm_accounts 
            SET state = 'COOLING_DOWN', cooldown_until = NOW() + interval '1 hour' * $1
            WHERE id = $2
          `, [cooldownHours, accountId]);
          
          logger.warn({ 
            type: 'risk_mitigation', 
            reason: 'high_risk_score',
            accountId: account.id, 
            risk: finalRisk,
            proxyHealth 
          });
      }
      
      return finalRisk;
    } catch(e) {
        return 0;
    }
  }
};
