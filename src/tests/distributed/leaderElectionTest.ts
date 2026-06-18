import { acquireLock, releaseLock } from '../../system/locks.js';
import { randomUUID } from 'crypto';

export async function runLeaderElectionTest() {
  console.log('\n--- Starting Distributed Leader Election Test ---');

  const lockKey = `cron_test_${randomUUID()}`;
  
  // Simulate 5 instances trying to acquire the lock at the exact same time
  const instances = 5;
  let acquireCount = 0;
  
  const promises = Array.from({ length: instances }).map(async (_, id) => {
    // Adding slight random jitter
    await new Promise(r => setTimeout(r, Math.random() * 10));
    
    // Acquire for 5 seconds
    const locked = await acquireLock(lockKey, 5000);
    if (locked) {
      acquireCount++;
      return id;
    }
    return null;
  });

  const results = await Promise.all(promises);
  const leaders = results.filter(id => id !== null);

  console.log(`✅ ${instances} workers attempted to acquire the lock.`);
  console.log(`✅ Lock acquired ${acquireCount} times.`);
  
  if (acquireCount === 1) {
    console.log(`✅ SUCCESS: Only Worker ${leaders[0]} became the leader. No double execution.`);
  } else {
    console.error(`❌ FAILURE: ${acquireCount} workers acquired the lock!`);
  }

  // Cleanup
  await releaseLock(lockKey);
}
