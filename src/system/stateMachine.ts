import { db } from '../db.js';
import { AppContext } from './context.js';
import { logger } from './logger.js';

export type AccountState =
  | 'NEW'
  | 'WARMING_UP'
  | 'ACTIVE'
  | 'LIMITED'
  | 'COOLING_DOWN'
  | 'SUSPENDED'
  | 'QUARANTINED'
  | 'BANNED';

const transitions: Record<AccountState, AccountState[]> = {
  'NEW': ['WARMING_UP'],
  'WARMING_UP': ['ACTIVE', 'LIMITED', 'QUARANTINED'],
  'ACTIVE': ['LIMITED', 'COOLING_DOWN', 'QUARANTINED'],
  'LIMITED': ['COOLING_DOWN', 'SUSPENDED', 'QUARANTINED'],
  'COOLING_DOWN': ['ACTIVE', 'SUSPENDED', 'QUARANTINED'],
  'QUARANTINED': ['ACTIVE', 'BANNED'],
  'SUSPENDED': ['COOLING_DOWN', 'BANNED'],
  'BANNED': [],
};

export async function transitionAccountState(
  ctx: AppContext,
  accountId: string | number,
  nextState: AccountState,
  reason: string
) {
  return await db.withTenant(ctx.tenantId, async (client) => {
    const { rows } = await client.query(
      `SELECT state FROM farm_accounts WHERE id = $1 FOR UPDATE`,
      [accountId]
    );

    const current = (rows[0]?.state as AccountState) || 'NEW';

    // Strict transition check
    if (!transitions[current]?.includes(nextState)) {
      logger.warn({ 
        type: 'invalid_transition', 
        accountId, 
        from: current, 
        to: nextState, 
        traceId: ctx.traceId 
      });
      throw new Error(`Invalid transition: ${current} → ${nextState}`);
    }

    await client.query(
      `UPDATE farm_accounts
       SET state = $1, last_error = CASE WHEN $1 IN ('LIMITED', 'SUSPENDED', 'BANNED') THEN NOW() ELSE last_error END, updated_at = NOW()
       WHERE id = $2`,
      [nextState, accountId]
    );

    await client.query(
      `INSERT INTO account_state_events
       (account_id, from_state, to_state, reason, trace_id, tenant_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [accountId, current, nextState, reason, ctx.traceId, ctx.tenantId]
    );

    logger.info({ 
      type: 'account_state_transition', 
      accountId, 
      from: current, 
      to: nextState, 
      reason, 
      traceId: ctx.traceId 
    });
  });
}
