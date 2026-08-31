import { keywords, searchGroups } from './search.js';
import { joinGroup } from './joiner.js';
import { analyzeGroup } from './groupAnalyzer.js';
import { db } from '../db.js';
import { getClient } from '../farm/clientPool.js';

let joinsToday = 0;

export async function runTraffic() {
  console.log('[Traffic Engine] Running distributed traffic search...');

  // Get all active hunters / hybrid accounts
  const res = await db.query(`
    SELECT * FROM farm_accounts 
    WHERE status IN ('active', 'warmup') 
      AND (role = 'hybrid' OR role = 'hunter')
  `);
  const accounts = res.rows;
  if (accounts.length === 0) {
      console.log('[Traffic Engine] No active accounts for traffic generation');
      return;
  }

  // Round-robin index
  let accountIndex = 0;

  for (const keyword of keywords) {
    if (joinsToday > 20) break; // global max per cycle

    // Distribute keywords among accounts to prevent one account taking all load
    const account = accounts[accountIndex % accounts.length];
    accountIndex++;

    try {
      const client = await getClient(account);
      const groups = await searchGroups(client, keyword);

      let accountJoinsThisCycle = 0;
      for (const group of groups) {
        if (group.username) {
            const analysis = analyzeGroup(group.title || "", group.about || "");
            if (analysis.isRelevant && !analysis.risky) {
              await joinGroup(client, group.username);
              joinsToday++;
              accountJoinsThisCycle++;
              if (accountJoinsThisCycle >= 2) break; // Max 2 joins per keyword per account
              await new Promise(res => setTimeout(res, 30000)); // Delay between joins for this account
            }
        }
      }
    } catch (e: any) {
        console.error(`[Traffic Engine] Error for account #${account.id} on keyword:`, e.message);
    }
  }
}
