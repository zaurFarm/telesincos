import { logger } from './logger.js';
import { connection } from '../queue/redis.js';

type ShutdownHook = () => Promise<void>;
const hooks: ShutdownHook[] = [];

export function registerShutdownHook(hook: ShutdownHook) {
  hooks.push(hook);
}

export function setupGracefulShutdown(processName: string, timeoutMs: number = 15000) {
  let isShuttingDown = false;

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    logger.info({ type: 'shutdown_start', message: `[${processName}] Received ${signal}. Starting graceful shutdown...` });

    const timeout = setTimeout(() => {
      logger.error({ type: 'shutdown_timeout', message: `[${processName}] Force exiting after timeout` });
      process.exit(1);
    }, timeoutMs);

    try {
      // Execute all hooks concurrently or sequentially? 
      // Sequentially is safer to avoid overwhelming the DB/Redis while shutting down
      for (const hook of hooks) {
        await hook();
      }

      // Close Redis connection
      if (connection.status !== 'end') {
        await connection.quit();
      }

      // Close DB connection
      try {
        const { closeDB } = await import('../db.js');
        await closeDB();
      } catch (err) {
        logger.error({ type: 'shutdown_error', message: 'Failed to close DB', error: err });
      }

      clearTimeout(timeout);
      logger.info({ type: 'shutdown_success', message: `[${processName}] All connections and hooks closed safely` });
      process.exit(0);
    } catch (err) {
      logger.error({ type: 'shutdown_error', message: `[${processName}] Error during shutdown`, error: err });
      clearTimeout(timeout);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  
  process.on('uncaughtException', async (err) => {
     logger.error({ type: 'uncaughtException', message: err.message, stack: err.stack });
     await shutdown('uncaughtException');
  });

  process.on('unhandledRejection', async (reason) => {
     logger.error({ type: 'unhandledRejection', message: String(reason) });
     await shutdown('unhandledRejection');
  });
}
