import { monitorEventLoopDelay } from 'perf_hooks';
import { SystemHealth } from './health.js';

export function startWatchdog(health: SystemHealth) {
  const histogram = monitorEventLoopDelay();

  histogram.enable();

  setInterval(() => {
    const p99 = histogram.percentile(99) / 1000000; // convert ns to ms
    const memUsage = process.memoryUsage().heapUsed / 1024 / 1024;

    if (memUsage > 1200 || p99 > 3000) {
      health.set('critical');
    } else if (memUsage > 800 || p99 > 1500) {
      health.set('degraded');
    } else {
      health.set('healthy');
    }

    histogram.reset();
  }, 5000);
}

