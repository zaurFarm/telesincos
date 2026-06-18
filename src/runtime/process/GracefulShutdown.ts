export class GracefulShutdown {
  private static registeredHooks: Array<() => Promise<void>> = [];

  static register(hook: () => Promise<void>) {
    this.registeredHooks.push(hook);
  }

  static async initiate(signal: string) {
    console.log(`\n[Process] Received ${signal}. Starting graceful shutdown...`);
    
    setTimeout(() => {
      console.error('[Process] Shutdown timed out. Forcing exit.');
      process.exit(1);
    }, 10000); // 10 seconds hard timeout

    for (const hook of this.registeredHooks) {
      try {
        await hook();
      } catch (err: any) {
         console.error('[Process] Error during shutdown hook:', err.message);
      }
    }
    
    console.log('[Process] Shutdown complete.');
    process.exit(0);
  }

  static attachHandlers() {
    process.on('SIGINT', () => this.initiate('SIGINT'));
    process.on('SIGTERM', () => this.initiate('SIGTERM'));
    
    process.on('uncaughtException', (err) => {
      console.error('FATAL: Uncaught Exception:', err);
      // Depending on severity, we might want to shut down here.
      // this.initiate('UNCAUGHT_EXCEPTION'); 
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
    });
  }
}
