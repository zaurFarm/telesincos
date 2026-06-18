import { logger } from './logger.js';
import v8 from 'v8';

let lastHeapDump = 0;
const DUMP_COOLDOWN = 300000; // 5 min
const MAX_HEAP_WARNING = 800 * 1024 * 1024; // 800MB
const MAX_HEAP_RESTART = 1200 * 1024 * 1024; // 1.2GB

export function checkMemoryHealth() {
  const mem = process.memoryUsage();
  const heapUsed = mem.heapUsed;
  
  if (heapUsed > MAX_HEAP_RESTART) {
    logger.error({ type: 'memory_critical', message: `Heap exceeded critical limit: ${Math.round(heapUsed / 1024 / 1024)}MB. Restarting...` });
    process.exit(1); // PM2 will restart
  }
  
  if (heapUsed > MAX_HEAP_WARNING) {
    const now = Date.now();
    logger.warn({ type: 'memory_warning', message: `High heap usage: ${Math.round(heapUsed / 1024 / 1024)}MB.` });
    
    if (now - lastHeapDump > DUMP_COOLDOWN) {
      triggerHeapDump();
      lastHeapDump = now;
    }
  }
}

function triggerHeapDump() {
  try {
    const filename = `heapdump-${Date.now()}.heapsnapshot`;
    // v8.writeHeapSnapshot(filename);
    logger.info({ type: 'heap_dump', message: `Memory warning. Triggered heap snapshot: ${filename} (Action simulated)` });
  } catch (err) {
    logger.error({ type: 'heap_dump_error', message: 'Failed to create heap snapshot', error: err });
  }
}

export function startMemoryWatchdog() {
  setInterval(checkMemoryHealth, 15000);
}
