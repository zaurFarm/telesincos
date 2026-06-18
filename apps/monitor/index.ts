import { SystemHealth } from '../../src/system/health.js';
import { startWatchdog } from '../../src/system/watchdog.js';
import { startOrchestrator } from './orchestrator.js';

console.log('[MONITOR] Booting...');

const health = new SystemHealth();

startWatchdog(health);
startOrchestrator(health);

setInterval(() => {
  const current = health.get();
  if (current !== 'healthy') {
    console.log('[MONITOR] Current Health State:', current);
  }
}, 5000);
