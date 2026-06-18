import { db as pool } from '../db.js';
import { pickAccount, markAccountUsed } from '../telegram/accountRouter.js';

export async function getAvailableAccount() {
  return await pickAccount({});
}

export async function resetLimits() {
  await pool.query(`
    UPDATE farm_accounts
    SET sent_today = 0
  `);
}

export async function incrementUsage(accountId: string) {
  await markAccountUsed(accountId);
}

export async function getActionCountToday() {
  const res = await pool.query(`
    SELECT SUM(sent_today) as total FROM farm_accounts WHERE status = 'active'
  `);
  return res.rows && res.rows.length > 0 ? Number(res.rows[0].total) || 0 : 0;
}

export async function updateAccountPerformance(accountId: number) {
  // reply_rate + trust_score - block_events
  await pool.query(`
    UPDATE farm_accounts
    SET performance_score = (reply_rate + trust_score - block_events)
    WHERE id = $1
  `, [accountId]);
}

export async function logAccountEvent(accountId: number, eventType: 'reply' | 'block') {
  if (eventType === 'reply') {
      await pool.query(`UPDATE farm_accounts SET reply_rate = reply_rate + 0.1 WHERE id = $1`, [accountId]);
  } else if (eventType === 'block') {
      await pool.query(`UPDATE farm_accounts SET block_events = block_events + 1 WHERE id = $1`, [accountId]);
  }
  await updateAccountPerformance(accountId);
}