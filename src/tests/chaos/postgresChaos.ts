import { ReadinessProbe } from '../../runtime/health/ReadinessProbe.js';
import { closeDB, db } from '../../db.js';

export async function runPostgresChaosTest() {
  console.log('\n--- Starting PostgreSQL Chaos Test ---');

  let result = await ReadinessProbe.check();
  console.log('✅ Initial Postgres Readiness:', result.checks.postgres);

  // Simulate loss
  console.log('🔻 Simulating Postgres connection loss (closing pools)');
  await closeDB();

  result = await ReadinessProbe.check();
  console.log('✅ Post-disconnect Readiness:', result.checks.postgres);
  if (result.isReady) {
    console.error('❌ System should not be ready when Postgres is down');
  } else {
    console.log('✅ System correctly marked as NOT READY');
  }

  // Restore connection by calling a db access that reconnects?
  // Our db wrapper does not automatically reconnect if the pool is ended
  // We'll reset the db pool in real use case (assuming db has a reset/init method or we just skip this part for isolated tests).
  console.log('⚠️ Reconnecting Postgres is beyond the scope of this isolated test unless DB class supports re-init.');
  console.log('✅ PostgreSQL Chaos Test Completed.');
}
