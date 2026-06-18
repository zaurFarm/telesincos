import { EnvironmentValidator } from '../config/EnvironmentValidator';
import { createServer } from './createServer';
import { createWorkers } from './createWorkers';
import { GracefulShutdown } from '../process/GracefulShutdown';
import { HealthService } from '../health/HealthService';
import { StructuredLogger } from '../observability/StructuredLogger';
import { GlobalSystemHealth } from '../../system/health/SystemHealthMonitor';

export class RuntimeBootstrap {
  static async initialize() {
    StructuredLogger.info('[Bootstrap] Initiating TeleSync OS runtime...');
    
    // 1. Environment Validation
    EnvironmentValidator.validateOrThrow();
    
    // 2. Attach Shutdown Hooks
    GracefulShutdown.attachHandlers();
    
    // 3. Start workers if enabled
    const workers = await createWorkers();
    
    // 4. Start API Server
    const app = createServer();
    
    // 5. Attach probes
    HealthService.attach(app);

    const PORT = parseInt(process.env.PORT || '3000', 10);
    // We bind to 0.0.0.0 for containerized environments
    const server = app.listen(PORT, '0.0.0.0', () => {
      StructuredLogger.info(`[Bootstrap] API Runtime active on port ${PORT}`);
    });

    GracefulShutdown.register(async () => {
       StructuredLogger.info('[Bootstrap] Stopping API server...');
       return new Promise((resolve) => {
         // Gracefully close server, stopping new connections
         server.close(() => resolve());
       });
    });
    
    // Start telemetry
    setInterval(() => {
        GlobalSystemHealth.getHealth();
    }, 10000);

    StructuredLogger.info('[Bootstrap] Master runtime initialized successfully.');
  }
}
