import { db } from '../db.js';

export async function getGlobalSystemState() {
  const defaultState = {
    is_paused: false,
    global_limit_hourly: 500,
    ban_rate_threshold: 0.2
  };
  
  try {
    let res = await db.query(`SELECT value FROM system_state WHERE key = 'main'`);
    if (res.rows.length === 0) {
      await db.query(`INSERT INTO system_state (key, value) VALUES ('main', $1)`, [JSON.stringify(defaultState)]);
      return defaultState;
    }
    return { ...defaultState, ...res.rows[0].value };
  } catch(e) {
    return defaultState;
  }
}

export async function updateSystemState(updates: any) {
    const current = await getGlobalSystemState();
    const next = { ...current, ...updates };
    await db.query(`UPDATE system_state SET value = $1, updated_at = NOW() WHERE key = 'main'`, [JSON.stringify(next)]);
}

export async function canSendGlobalMessage(): Promise<boolean> {
  const state = await getGlobalSystemState();
  if (state.is_paused) return false;

  // Check how many messages we sent in the last 1 hour
  try {
    const res = await db.query(`
      SELECT COUNT(id) as c FROM conversations 
      WHERE created_at > NOW() - interval '1 hour' AND role = 'assistant'
    `);
    const count = parseInt(res.rows[0].c || '0');
    
    if (count >= state.global_limit_hourly) return false;
    
    return true;
  } catch(e) {
    return true;
  }
}

export async function checkAutoShutdown() {
    // calculate ban rate in last 24h
    try {
        // Here we could count banned accounts vs total active, or recent blocks
        // For simplicity, let's count block events vs total sent today
        const res = await db.query(`
          SELECT 
            SUM(sent_today) as total_sent,
            SUM(block_events) as total_blocks
          FROM farm_accounts
        `);
        
        let sent = parseInt(res.rows[0]?.total_sent || '0');
        let blocks = parseInt(res.rows[0]?.total_blocks || '0');
        
        if (sent > 50) {
            const state = await getGlobalSystemState();
            const banRate = blocks / sent;
            if (banRate > state.ban_rate_threshold && !state.is_paused) {
                try {
                    const { logger } = await import('./logger.js');
                    logger.error({ type: 'system', message: `Ban rate ${banRate.toFixed(2)} exceeded threshold ${state.ban_rate_threshold}. AUTO-SHUTDOWN TRIGGERED.` });
                } catch(e) {}
                await updateSystemState({ is_paused: true });
            }
        }
    } catch(e) {
        
    }
}
