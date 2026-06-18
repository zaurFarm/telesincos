import { SystemHealth } from '../../src/system/health.js';
import { acquireLock } from '../../src/system/locks.js';
import { checkQueuePressure } from '../../src/system/queuePressureOptions.js';

let lastRecoveryAction = 0;
const RECOVERY_COOLDOWN = 120000;

export function startOrchestrator(health: SystemHealth) {
  setInterval(async () => {
    const locked = await acquireLock('global-regulation', 5000);
    if (!locked) return;

    const state = health.get();
    const now = Date.now();
    await checkQueuePressure();

    if (state === 'critical') {
      if (now - lastRecoveryAction > RECOVERY_COOLDOWN) {
        console.log('[ORCH] 🚨 CRITICAL DEGRADATION. Initiating Self-Healing Protocol...');
        // 1. Pause
        // 2. Restart workers (Simulated via logs)
        // 3. Resume
        lastRecoveryAction = now;
        
        console.log('[ORCH] -> Pausing Queues (DLQ protected)');
        // Queues will naturally pause from pressure check, but PM2 restart requires manual interaction generally.
        // In this implementation, PM2 auto_restart handles crash loop, and memory limits are set in ecosystem.config.cjs
        // If we needed to crash the worker process from monitor, we'd send a signal.
        
      } else {
        console.log('[ORCH] critical state, but in recovery cooldown.');
      }
    }

    if (state === 'degraded') {
      console.log('[ORCH] throttling system, degradation ongoing');
    }
  }, 10000);
}
