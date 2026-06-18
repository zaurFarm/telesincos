import { metrics } from './metrics.js';
import { logger } from './logger.js';
import { AppContext } from './context.js';

export const alerts = {
  async checkAnomalies(ctx: AppContext) {
    const summary = await metrics.getSummary(ctx.tenantId, '15 minutes');
    
    const findMetric = (name: string) => summary.find((m: any) => m.name === name);
    
    // 1. BAN SPIKE
    const attempts = Number(findMetric('tg.send_attempt')?.count || 0);
    const failures = Number(findMetric('tg.send_failure')?.count || 0);
    const banRate = failures / (attempts || 1);
    
    if (banRate > 0.15 && attempts > 10) {
      logger.error({ 
        type: 'alert_critical', 
        reason: 'ban_spike_detected', 
        rate: banRate, 
        tenantId: ctx.tenantId 
      });
      return { severity: 'critical', type: 'ban_spike' };
    }

    // 2. AI DEGRADATION
    const aiFailures = Number(findMetric('ai.generation_failure')?.count || 0);
    if (aiFailures > 20) {
       logger.warn({ 
         type: 'alert_warning', 
         reason: 'ai_degradation', 
         count: aiFailures, 
         tenantId: ctx.tenantId 
       });
       return { severity: 'warning', type: 'ai_fail' };
    }

    return null;
  }
};
