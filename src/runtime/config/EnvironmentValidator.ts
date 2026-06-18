export class EnvironmentValidator {
  static validateOrThrow() {
     const required = ['ADMIN_TOKEN', 'JWT_SECRET', 'DATABASE_URL'];
     
     if (process.env.NODE_ENV !== 'production') {
        const missing = required.filter(k => !process.env[k]);
        if (missing.length > 0) {
            console.warn(`[Config] Warning: Missing environment variables in dev: ${missing.join(', ')}`);
        }
        return; // Allow fallback in dev
     }

     for (const key of required) {
        if (!process.env[key]) {
            throw new Error(`FATAL_RUNTIME_ERROR: ${key} is required in production environment.`);
        }
     }
     
     if (!process.env.DISABLE_WORKERS && !process.env.REDIS_URL) {
         throw new Error(`FATAL_RUNTIME_ERROR: REDIS_URL is required for workers in production.`);
     }
  }
}
