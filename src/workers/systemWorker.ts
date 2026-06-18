import { governor } from '../system/governor.js';
import { logger } from '../system/logger.js';
import { db } from '../db.js';

/**
 * System Worker: Internal housekeeping and resilience monitoring.
 * Does NOT use BullMQ to avoid overhead, runs as a simple interval loop.
 */
let systemIntervals: NodeJS.Timeout[] = [];

export async function startSystemWorker() {
  logger.info({ type: 'system_worker_start', message: 'Hosekeeping worker initialized' });

  // 1. Global Resilience Loop (Every 1 minute)
  systemIntervals.push(setInterval(async () => {
    const { acquireLock } = await import('../system/locks.js');
    if (!(await acquireLock('cron_system_health', 45000))) return;

    try {
      await governor.checkGlobalHealth();
      await governor.autoHeal();
    } catch (e: any) {
      if (e.code !== 'ECONNREFUSED' && !e.message?.includes('ECONNREFUSED')) {
        logger.error({ type: 'housekeeping_error', error: String(e) });
      }
    }
  }, 60000));

  // 2. Tenant Governance Loop (Every 5 minutes)
  systemIntervals.push(setInterval(async () => {
    const { acquireLock } = await import('../system/locks.js');
    if (!(await acquireLock('cron_tenant_gov', 4 * 60 * 1000))) return;

    try {
      const tenants = await db.query(`SELECT id FROM farm_workspaces WHERE state = 'ACTIVE'`);
      for (const row of tenants.rows) {
        await governor.evaluateTenant(row.id);
      }
    } catch (e: any) {
      if (e.code !== 'ECONNREFUSED' && !e.message?.includes('ECONNREFUSED')) {
        logger.error({ type: 'tenant_governance_error', error: String(e) });
      }
    }
  }, 300000));
}

export function stopSystemWorker() {
  systemIntervals.forEach(clearInterval);
  systemIntervals = [];
}
