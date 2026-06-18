import { db } from '../db.js';
import { AppContext } from './context.js';
import { logger } from './logger.js';

/**
 * LoadControl: Manages system fairness and prevent Noisy Neighbors.
 */
export const loadControl = {
  /**
   * Checks if a tenant has capacity to run a high-load task (AI, TG send).
   */
  async canExecute(ctx: AppContext, taskType: string, tenantLimits: any) {
    const limit = tenantLimits[taskType] || 10; // Default 10 concurrent tasks
    
    // In-memory counter or Redis would be faster, but let's use DB for consistency in this example
    const res = await db.withTenant(ctx.tenantId, async (client) => {
      return await client.query(
        `SELECT COUNT(*) as count FROM usage_events 
         WHERE tenant_id = $1 AND type = $2 AND status = 'RESERVED'
         AND created_at > NOW() - INTERVAL '5 minutes'`,
        [ctx.tenantId, taskType]
      );
    });

    const activeCount = Number(res.rows[0].count);
    
    if (activeCount >= limit) {
      logger.warn({ 
        type: 'load_control_rejection', 
        tenantId: ctx.tenantId, 
        taskType, 
        activeCount, 
        limit,
        traceId: ctx.traceId 
      });
      return false;
    }
    
    return true;
  }
};
