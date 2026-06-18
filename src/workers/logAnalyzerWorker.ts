import { runLogAnalyzer } from '../system/logAnalyzer.js';
import { logger } from '../system/logger.js';

let interval: ReturnType<typeof setInterval>;

export function startLogAnalyzer() {
  logger.info({ type: 'worker_startup', message: 'Starting AI Log Analyzer worker' });
  
  const runWithLock = async () => {
    const { acquireLock } = await import('../system/locks.js');
    const locked = await acquireLock('cron_log_analyzer', 4 * 60 * 1000); // 4 min lock
    if (locked) {
       await runLogAnalyzer();
    }
  };

  // Run immediately then every 5 minutes
  runWithLock();
  interval = setInterval(runWithLock, 5 * 60 * 1000);
}

export function stopLogAnalyzer() {
  if (interval) clearInterval(interval);
}
