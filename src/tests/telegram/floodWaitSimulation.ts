import { db } from '../../db.js';
import { handleBanDetection } from '../../telegram/accountRouter.js';
import { AppContext } from '../../system/context.js';
import { randomUUID } from 'crypto';

export async function runFloodWaitSimulation() {
  console.log('\n--- Starting FloodWait Simulation for 100+ accounts ---');
  
  const tenantId = 'tenant_1';
  const ctx: AppContext = { tenantId, traceId: randomUUID(), createdAt: Date.now() };
  
  // Clean up any old test accounts
  await db.query(`DELETE FROM farm_accounts WHERE phone LIKE '999%'`);

  // Create 105 mock accounts
  const accounts: string[] = [];
  for (let i = 0; i < 105; i++) {
    const phone = `999${Math.floor(1000000 + Math.random() * 9000000)}`;
    const res = await db.query(`
      INSERT INTO farm_accounts (phone, state, trust_score, flood_count)
      VALUES ($1, 'ACTIVE', 100, 0)
      RETURNING id
    `, [phone]);
    accounts.push(res.rows[0].id);
  }

  let coolingDown = 0;
  let quarantined = 0;

  for (const accountId of accounts) {
    // Simulate 1 FLOOD_WAIT
    const res1 = await handleBanDetection(accountId, 'FLOOD_WAIT 300', ctx);
    
    // Check state in DB
    const state1 = await db.query(`SELECT state, cooldown_until, flood_count FROM farm_accounts WHERE id = $1`, [accountId]);
    if (state1.rows[0].state === 'COOLING_DOWN') {
      coolingDown++;
    }

    // Simulate 4 more FLOOD_WAITs to trigger quarantine
    await handleBanDetection(accountId, 'FLOOD_WAIT 300', ctx);
    await handleBanDetection(accountId, 'FLOOD_WAIT 300', ctx);
    await handleBanDetection(accountId, 'FLOOD_WAIT 300', ctx);
    await handleBanDetection(accountId, 'FLOOD_WAIT 300', ctx); // 5th

    const state5 = await db.query(`SELECT state FROM farm_accounts WHERE id = $1`, [accountId]);
    if (state5.rows[0].state === 'QUARANTINED') {
      quarantined++;
    }
  }

  console.log(`✅ Simulated FLOOD_WAIT on ${accounts.length} accounts`);
  console.log(`✅ Accounts transitioned to COOLING_DOWN (after 1st): ${coolingDown}`);
  console.log(`✅ Accounts transitioned to QUARANTINED (after 5th): ${quarantined}`);
  
  // Cleanup
  await db.query(`DELETE FROM farm_accounts WHERE id = ANY($1)`, [accounts]);
}
