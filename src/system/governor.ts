import { db } from '../db.js';
import { logger } from './logger.js';
import { orchestrator } from './orchestrator.js';
import { aiQueue, tgQueue } from '../queue/index.js';
import { createContext } from './context.js';
import { transitionAccountState } from './stateMachine.js';

/**
 * Governor: The brain of system security and reliability.
 * Evaluates tenant usage, error rates, and stops runaway processes.
 */
export const governor = {
  /**
   * Evaluate global platform health. If ban-rate is > 10% in 5 min, pause EVERYTHING.
   */
  async checkGlobalHealth() {
    try {
      // Check if there is an active emergency stop in the database
      const stopCheck = await db.query(`SELECT value FROM farm_workspace_settings WHERE key = 'emergency_stop' AND value = 'true'`);
      if (stopCheck.rows.length > 0) {
        return true;
      }

      const banStats = await db.query(`
        SELECT COUNT(*) as ban_count 
        FROM actions 
        WHERE type = 'ban' AND created_at > NOW() - INTERVAL '5 minutes'
      `);
      
      const banCount = Number(banStats.rows[0]?.ban_count || 0);
      
      if (banCount > 10) {
        logger.error({ 
          type: 'governor_emergency_stop', 
          message: 'GLOBAL BAN WAVE DETECTED. Pausing all platform activities.',
          banCount 
        });
        
        // Mark emergency stop
        await db.query(`
          INSERT INTO farm_workspace_settings (key, value) 
          VALUES ('emergency_stop', 'true')
          ON CONFLICT (key) DO UPDATE SET value = 'true'
        `);
        
        await db.query(`UPDATE farm_workspaces SET state = 'PAUSED' WHERE state = 'ACTIVE'`);
        return true;
      }
      return false;
    } catch (e: any) {
      if (e.code !== 'ECONNREFUSED' && !e.message?.includes('ECONNREFUSED')) {
        logger.error({ type: 'governor_global_check_failed', error: String(e) });
      }
      return false;
    }
  },

  async isEmergencyStopActive() {
    try {
      const res = await db.query(`SELECT value FROM farm_workspace_settings WHERE key = 'emergency_stop' AND value = 'true'`);
      return res.rows.length > 0;
    } catch (e) {
      return false;
    }
  },

  async engageEmergencyStop() {
    try {
      await db.query(`
        INSERT INTO farm_workspace_settings (key, value) 
        VALUES ('emergency_stop', 'true')
        ON CONFLICT (key) DO UPDATE SET value = 'true'
      `);
      await db.query(`UPDATE farm_workspaces SET state = 'PAUSED' WHERE state = 'ACTIVE'`);
      logger.error({ type: 'governor_emergency_stop', message: 'Emergency stop engaged' });
    } catch (e: any) {
      if (e.code !== 'ECONNREFUSED' && !e.message?.includes('ECONNREFUSED')) {
        logger.error({ type: 'governor_emergency_stop_failed', error: String(e) });
      }
    }
  },

  /**
   * Automatically resume accounts from COOLING_DOWN state
   */
  async autoHeal() {
    try {
      const res = await db.query(`
        UPDATE farm_accounts 
        SET state = 'ACTIVE', cooldown_until = NULL 
        WHERE state = 'COOLING_DOWN' AND cooldown_until < NOW()
        RETURNING id
      `);
      
      if (res.rowCount && res.rowCount > 0) {
        logger.info({ 
          type: 'governor_auto_heal', 
          message: `Healed ${res.rowCount} accounts back to ACTIVE state`,
          accountIds: res.rows.map(r => r.id)
        });
      }
    } catch (e: any) {
      if (e.code !== 'ECONNREFUSED' && !e.message?.includes('ECONNREFUSED')) {
        logger.error({ type: 'governor_auto_heal_failed', error: String(e) });
      }
    }
  },

  async evaluateTenant(tenantId: string) {
    try {
      const ctx = createContext(tenantId, 'system');
      
      // 1. BILLING ANOMALIES (High revert rate)
      const billingRes = await db.withTenant(tenantId, async (client) => {
        return await client.query(
          `SELECT 
            COUNT(*) FILTER (WHERE status = 'REVERTED') as reverts,
            COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirms
           FROM usage_events
           WHERE created_at > NOW() - INTERVAL '15 minutes'`,
        );
      });

      const { reverts, confirms } = billingRes.rows[0];
      const total = Number(reverts) + Number(confirms);
      const revertRate = Number(reverts) / (total || 1);

      if (revertRate > 0.3 && total > 5) {
        logger.warn({ type: 'governor_action', tenantId, reason: 'high_billing_revert_rate', revertRate });
        await orchestrator.pauseFarm(tenantId, 'admin');
        return;
      }

      // 2. QUEUE PRESSURE (High lag)
      const tgJobCount = await tgQueue.getWaitingCount();
      if (tgJobCount > 500) {
        logger.warn({ type: 'governor_action', tenantId, reason: 'tg_queue_pressure', count: tgJobCount });
      }

      // 3. ANOMALY DETECTION (Alert-based)
      const { alerts } = await import('./autoAlerts.js');
      const anomaly = await (alerts as any).checkAnomalies(ctx);
      if (anomaly?.severity === 'critical') {
        logger.error({ type: 'governor_emergency_stop', tenantId, anomaly });
        await orchestrator.pauseFarm(tenantId, 'admin');
      }

    } catch (err: any) {
      if (err.code !== 'ECONNREFUSED' && !err.message?.includes('ECONNREFUSED')) {
        logger.error({ type: 'governor_eval_failed', err, tenantId });
      }
    }
  },

  /**
   * Evaluate a single account's health based on FloodWait frequency
   */
  async evaluateAccount(tenantId: string, accountId: string) {
    try {
      const res = await db.withTenant(tenantId, async (client) => {
        return await client.query(
          `SELECT flood_count, state FROM farm_accounts WHERE id = $1`,
          [accountId]
        );
      });

      if (!res.rows.length) return;

      const acc = res.rows[0];
      if (acc.flood_count > 5 && acc.state === 'ACTIVE') {
        const ctx = createContext(tenantId, 'system');
        logger.warn({ type: 'governor_action', accountId, msg: 'Suspending account due to multiple flood waits.' });
        await transitionAccountState(ctx, accountId, 'SUSPENDED', 'multiple_flood_waits');
      }
    } catch (err: any) {
      if (err.code !== 'ECONNREFUSED' && !err.message?.includes('ECONNREFUSED')) {
        logger.error({ type: 'governor_eval_failed', err, accountId, tenantId });
      }
    }
  }
};
