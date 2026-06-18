import express from 'express';
import { ReadinessProbe } from './ReadinessProbe.js';
import { LivenessProbe } from './LivenessProbe.js';

export class HealthService {
  static attach(app: express.Application) {
    app.get('/health/live', (req, res) => {
      res.json(LivenessProbe.check());
    });

    app.get('/health/ready', async (req, res) => {
      const result = await ReadinessProbe.check();
      if (!result.isReady) {
        return res.status(503).json(result);
      }
      res.json(result);
    });
    
    console.log('[HealthService] Liveness and readiness endpoints attached.');
  }
}
