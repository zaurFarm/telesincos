import { SystemHealth } from '../../src/system/health.js';
import { startWatchdog } from '../../src/system/watchdog.js';
import { startOrchestrator } from './orchestrator.js';
import { setupGracefulShutdown, registerShutdownHook } from '../../src/system/shutdown.js';

console.log('[MONITOR] Booting...');

setupGracefulShutdown('MONITOR', 10000);

const health = new SystemHealth();

startWatchdog(health);
startOrchestrator(health);

const healthInterval = setInterval(() => {
  const current = health.get();
  if (current !== 'healthy') {
    console.log('[MONITOR] Current Health State:', current);
  }
}, 5000);

// Clean up the interval on shutdown so the process can exit cleanly
registerShutdownHook(async () => {
  clearInterval(healthInterval);
  console.log('[MONITOR] Health interval cleared.');
});
