import { db } from '../db.js';
import { emitEvent } from './events.js';
import { logger } from './logger.js';
import { getContext } from './context.js';

export interface Plan {
  id: string;
  name: string;
  ai_calls_limit: number;
  accounts_limit: number;
  price_month: number;
}

export interface TenantSubscription {
  tenant_id: string;
  plan_id: string;
  status: 'active' | 'past_due' | 'canceled';
  current_period_end: Date;
}

export async function initBillingDB() {
  try {
    // We rely on db.ts for table creation to ensure RLS and context consistency,
    // but we can ensure default data here.
    
    // Insert default plans if not exists
    await db.query(`
      INSERT INTO plans (id, name, ai_calls_limit, accounts_limit)
      VALUES 
        ('starter', 'Starter', 1000, 3),
        ('pro', 'Pro', 10000, 10),
        ('enterprise', 'Enterprise', 100000, 50)
      ON CONFLICT (id) DO NOTHING;
    `);

    // Seed a demo subscription ONLY in development / when explicitly requested.
    // Never auto-grant a paid plan in production.
    if (process.env.SEED_DEMO_SUBSCRIPTION === 'true' && process.env.NODE_ENV !== 'production') {
      await db.query(`
        INSERT INTO tenant_subscriptions (tenant_id, plan_id, status, current_period_end)
        VALUES ('tenant_1', 'pro', 'active', NOW() + INTERVAL '30 days')
        ON CONFLICT (tenant_id) DO NOTHING;
      `);
    }
  } catch (e: any) {
    console.error('⚠️ Could not initialize billing DB (will retry or ignore):', e.message);
  }
}

export async function getPlanLimit(tenantId: string, metric: 'ai_calls_limit' | 'accounts_limit'): Promise<number> {
  const res = await db.query(`
    SELECT p.* FROM plans p
    JOIN tenant_subscriptions ts ON ts.plan_id = p.id
    WHERE ts.tenant_id = $1 AND ts.status = 'active'
  `, [tenantId]);

  if (res.rows.length === 0) return 0; // No active plan = 0 limit
  return res.rows[0][metric] || 0;
}

export async function getUsage(tenantId: string, metric: string): Promise<number> {
  const res = await db.query(`
    SELECT value FROM usage_counters WHERE tenant_id = $1 AND metric = $2
  `, [tenantId, metric]);
  
  if (res.rows.length === 0) return 0;
  return res.rows[0].value;
}

export async function incrementUsage(tenantId: string, metric: string, amount: number = 1) {
  await db.query(`
    INSERT INTO usage_counters (tenant_id, metric, value)
    VALUES ($1, $2, $3)
    ON CONFLICT (tenant_id, metric) 
    DO UPDATE SET value = usage_counters.value + EXCLUDED.value
  `, [tenantId, metric, amount]);
  
  await emitEvent('usage_incremented', { tenantId, metric, amount });
}

export async function checkLimits(tenantId: string, metricName: 'ai_calls_limit' | 'accounts_limit', usageMetricName: string, amount: number = 1) {
  const limit = await getPlanLimit(tenantId, metricName);
  const currentUsage = await getUsage(tenantId, usageMetricName);
  
  if (currentUsage + amount > limit) {
    await emitEvent('limit_exceeded', { tenantId, metricName, limit, currentUsage, attempted: amount });
    throw new Error(`Billing limit exceeded for ${metricName}. Usage: ${currentUsage}/${limit}. Please upgrade your plan.`);
  }
}

export const billing = {
  async reserve(tenantId: string, type: string, amount: number = 1) {
    const context = getContext();
    return await db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `INSERT INTO usage_events (tenant_id, type, amount, status, trace_id)
         VALUES ($1, $2, $3, 'RESERVED', $4) RETURNING id`,
        [tenantId, type, amount, context?.traceId]
      );
      return res.rows[0].id as string;
    });
  },

  async confirm(tenantId: string, id: string) {
    return await db.withTenant(tenantId, async (client) => {
      const res = await client.query(
        `UPDATE usage_events SET status='CONFIRMED', updated_at=NOW() WHERE id=$1 RETURNING tenant_id, type, amount`,
        [id]
      );
      if (res.rows.length > 0) {
        const { type, amount } = res.rows[0];
        // We can optionally update usage_counters here or just rely on events
        await client.query(`
          INSERT INTO usage_counters (tenant_id, metric, value)
          VALUES ($1, $2, $3)
          ON CONFLICT (tenant_id, metric) 
          DO UPDATE SET value = usage_counters.value + EXCLUDED.value
        `, [tenantId, type, amount]);
      }
    });
  },

  async revert(tenantId: string, id: string) {
    return await db.withTenant(tenantId, async (client) => {
      await client.query(
        `UPDATE usage_events SET status='REVERTED', updated_at=NOW() WHERE id=$1`,
        [id]
      );
    });
  },

  async reclaimExpiredReserves() {
    // This is a system-wide job, so we iterate over workspaces if needed 
    // or just run it with a privileged bypass if allowed, 
    // but for safety we'll use withTenant or run it as a cleanup task
    const workspacesRes = await db.query(`SELECT id::text FROM workspaces`);
    for (const workspace of workspacesRes.rows) {
      await db.withTenant(workspace.id, async (client) => {
        await client.query(`
          UPDATE usage_events 
          SET status = 'REVERTED', updated_at = NOW()
          WHERE status = 'RESERVED' AND expires_at < NOW()
        `);
      });
    }
  }
};

export async function resetUsage(tenantId: string) {
  await db.query(`DELETE FROM usage_counters WHERE tenant_id = $1`, [tenantId]);
  await emitEvent('usage_reset', { tenantId });
}

export async function getBillingDash(tenantId: string) {
  const planRes = await db.query(`
    SELECT p.name, p.ai_calls_limit, p.accounts_limit, ts.status, ts.current_period_end 
    FROM tenant_subscriptions ts
    JOIN plans p ON p.id = ts.plan_id
    WHERE ts.tenant_id = $1
  `, [tenantId]);
  
  const aiUsage = await getUsage(tenantId, 'ai_calls');
  const accountsUsage = await getUsage(tenantId, 'accounts');

  if (planRes.rows.length === 0) {
    return { plan: 'None', status: 'inactive', usage: { ai_calls: aiUsage, accounts: accountsUsage }, limits: { ai_calls_limit: 0, accounts_limit: 0 } };
  }
  
  const plan = planRes.rows[0];
  return {
    plan: plan.name,
    status: plan.status,
    period_end: plan.current_period_end,
    usage: {
      ai_calls: aiUsage,
      accounts: accountsUsage
    },
    limits: {
      ai_calls_limit: plan.ai_calls_limit,
      accounts_limit: plan.accounts_limit
    }
  };
}
