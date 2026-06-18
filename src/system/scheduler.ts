import { pickAccount } from '../telegram/accountRouter.js';
import { AppContext } from './context.js';
import { logger } from './logger.js';
import { db } from '../db.js';

/**
 * Global registry for tenant execution density (for fairness).
 * In a distributed setup, this would be in Redis.
 */
const tenantLoadRegistry: Record<string, number> = {};

export const scheduler = {
  /**
   * Strategically selects the best account for a given task and calculates a safe delay.
   * Implements Fair-Share scheduling to prevent tenant starvation.
   */
  async scheduleTask(ctx: AppContext, taskType: string, options: any = {}) {
    // 1. FAIRNESS CHECK
    // If a tenant is over-active, we artificially increase their delay or lower their priority.
    const currentTenantLoad = tenantLoadRegistry[ctx.tenantId] || 0;
    
    // 2. ACCOUNT SELECTION (with scoring)
    const account = await pickAccount({ 
      ...options, 
      workspaceId: ctx.tenantId,
      isReply: options.isReply,
      leadScore: options.leadScore,
      tenantPressure: currentTenantLoad // Pass pressure to the router
    });

    if (!account) {
      logger.warn({ 
        type: 'scheduler_starvation', 
        tenantId: ctx.tenantId, 
        taskType, 
        traceId: ctx.traceId 
      });
      return null;
    }

    // 3. ADAPTIVE DELAY (Anti-Sync + Load Balancing)
    // base delay + human jitter + load penalty
    const baseDelay = taskType === 'cold_outreach' ? 15000 : 3000;
    const humanJitter = Math.floor(Math.random() * 20000); 
    
    // Penalty for high load (1s extra per 5 active jobs)
    const loadPenalty = Math.floor(currentTenantLoad / 5) * 1000;
    
    const totalDelay = baseDelay + humanJitter + loadPenalty;

    // Increment registry
    tenantLoadRegistry[ctx.tenantId] = (tenantLoadRegistry[ctx.tenantId] || 0) + 1;

    logger.info({ 
      type: 'task_scheduled', 
      accountId: account.id, 
      taskType, 
      delay: totalDelay, 
      tenantLoad: currentTenantLoad,
      traceId: ctx.traceId 
    });

    return { 
      account, 
      delay: totalDelay 
    };
  },

  /**
   * Decrement tenant load on job completion.
   */
  releaseCapacity(tenantId: string) {
    if (tenantLoadRegistry[tenantId] > 0) {
      tenantLoadRegistry[tenantId]--;
    }
  }
};
