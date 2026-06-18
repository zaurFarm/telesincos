import express from 'express';
import crypto from 'crypto';
import { runWithContext, createContext } from '../../system/context.js';
import { logger } from '../../system/logger.js';

export interface AuthRequest extends express.Request {
  user?: any;
  ctx: any;
  id?: string;
}

export function contextMiddleware(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  // If user is authenticated, we should have a tenantId/workspaceId
  const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId || 'tenant_1';
  
  const traceId = (req.headers['x-trace-id'] as string) || crypto.randomUUID();
  const requestId = crypto.randomUUID();
  req.id = requestId;

  req.ctx = createContext(String(tenantId), req.user ? 'user' : 'system');
  req.ctx.traceId = traceId;

  res.setHeader('X-Trace-Id', traceId);
  res.setHeader('X-Request-Id', requestId);

  // Simple Request Logging with AsyncLocalStorage tracing
  res.on('finish', () => {
     logger.info({
        type: 'http_request',
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        traceId,
        requestId,
        tenantId
     });
  });

  // Execute request inside the AsyncLocalStorage context wrapper
  runWithContext(req.ctx, () => {
    return Promise.resolve(next());
  });
}
