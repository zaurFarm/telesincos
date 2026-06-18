import express from 'express';
import cors from 'cors';
import { runWithContext } from '../../system/context.js';
import { SecurityPolicy } from '../security/SecurityPolicy.js';

export function createServer() {
  const app = express();
  
  // Security Layer
  SecurityPolicy.apply(app);
  
  // Middleware
  const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*';
  app.use(cors(allowedOrigins === '*' ? {} : { origin: allowedOrigins }));
  app.use(express.json());
  
  // System context injection will happen here
  // ...
  
  return app;
}
