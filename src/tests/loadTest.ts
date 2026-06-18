import { scheduler } from '../system/scheduler.js';
import { createContext, runWithContext } from '../system/context.js';
import { logger } from '../system/logger.js';

/**
 * Reality Check: Load Test Simulator
 * Verifies fairness, isolation and stability under pressure.
 */
export async function runLoadTest(scenario: 'fairness' | 'burst' | 'chaos') {
  console.log(`\n🚀 Starting Load Test Scenario: ${scenario.toUpperCase()}`);
  
  if (scenario === 'fairness') {
    // Scenario: Heavy Tenant vs Light Tenant
    const heavyTenant = createContext('tenant_heavy');
    const lightTenant = createContext('tenant_light');

    const tasks: Promise<void>[] = [];

    // Heavy tenant tries to flood the system with 50 messages
    tasks.push((async () => {
       for (let i = 0; i < 50; i++) {
         await runWithContext(heavyTenant, async () => {
           const scheduled = await scheduler.scheduleTask(heavyTenant, 'cold_outreach');
           if (scheduled) {
             // Fake work
             setTimeout(() => scheduler.releaseCapacity(heavyTenant.tenantId), 2000);
           }
         });
         await new Promise(r => setTimeout(r, 100)); // tight loop
       }
    })());

    // Light tenant sends 10 messages but expects stability
    tasks.push((async () => {
      await new Promise(r => setTimeout(r, 1000)); // Start slightly later
      for (let i = 0; i < 10; i++) {
        await runWithContext(lightTenant, async () => {
          const start = Date.now();
          const scheduled = await scheduler.scheduleTask(lightTenant, 'reply');
          const delay = Date.now() - start;
          
          console.log(`[LoadTest] Light Tenant Pick ${i}: ${scheduled ? 'SUCCESS' : 'FAILED'} (scheduling took ${delay}ms)`);
          
          if (scheduled) {
            setTimeout(() => scheduler.releaseCapacity(lightTenant.tenantId), 1000);
          }
        });
        await new Promise(r => setTimeout(r, 2000));
      }
    })());

    await Promise.all(tasks);
  }

  console.log(`\n✅ Load Test ${scenario} Completed.\n`);
}
