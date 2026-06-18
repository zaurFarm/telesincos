import { ReadinessProbe } from '../../runtime/health/ReadinessProbe.js';
import { connection } from '../../queue/redis.js';

export async function runRedisChaosTest() {
  console.log('\n--- Starting Redis Chaos Test ---');

  // Check initial state
  let result = await ReadinessProbe.check();
  console.log('✅ Initial Redis Readiness:', result.checks.redis);
  
  if (result.checks.redis === 'mock') {
    console.log('⚠️ Running in mock mode, skipping chaos test');
    return;
  }

  // Simulate loss
  console.log('🔻 Simulating Redis connection loss (disconnecting)');
  connection.disconnect();
  
  result = await ReadinessProbe.check();
  console.log('✅ Post-disconnect Readiness:', result.checks.redis);
  if (result.isReady) {
    console.error('❌ System should not be ready when Redis is down');
  } else {
    console.log('✅ System correctly marked as NOT READY');
  }

  // Restore connection
  console.log('🔺 Restoring Redis connection');
  await connection.connect();

  result = await ReadinessProbe.check();
  console.log('✅ Restored Redis Readiness:', result.checks.redis);
  if (!result.isReady) {
    console.error('❌ System should be ready after Redis recovers');
  } else {
    console.log('✅ System correctly marked as READY');
  }
}
