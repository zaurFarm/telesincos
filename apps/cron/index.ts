import { startCronJobs, stopCronJobs } from '../../src/system/cron.js';
import { registerShutdownHook, setupGracefulShutdown } from '../../src/system/shutdown.js';

console.log('[CRON] Booting external scheduler process...');

setupGracefulShutdown('CRON', 10000);

registerShutdownHook(async () => {
  console.log('[CRON] Stopping cron hooks...');
  stopCronJobs();
});

startCronJobs();
