import { db } from '../db.js';
import { AppContext } from './context.js';
import { logger } from './logger.js';
// Safe import for prometheus
import * as prom from './metricsExporter.js';

export const metrics = {
  /**
   * Records a point-in-time metric.
   */
  async track(ctx: AppContext, name: string, value: number = 1, tags: Record<string, any> = {}) {
    // Prometheus integration
    try {
      if (name === 'tg.send_success') {
        prom.telegram_messages_sent_total.labels(ctx.tenantId, String(tags.accountId || 'undefined')).inc();
      } else if (name === 'tg.send_failure') {
        const errType = String(tags.error).slice(0, 50) || 'unknown';
        prom.telegram_messages_failed_total.labels(ctx.tenantId, String(tags.accountId || 'undefined'), errType).inc();
      } else if (name === 'tg.flood_wait') {
        prom.telegram_floodwait_total.labels(ctx.tenantId, String(tags.accountId || 'undefined')).inc();
      } else if (name === 'ai.success') {
        prom.ai_requests_total.labels(ctx.tenantId, String(tags.model || 'default')).inc();
      } else if (name === 'ai.failure') {
        const errType = String(tags.error).slice(0, 50) || 'unknown';
        prom.ai_errors_total.labels(ctx.tenantId, String(tags.model || 'default'), errType).inc();
      }
    } catch (e) {
      // ignore
    }

    // Avoid blocking execution for metrics
    db.withTenant(ctx.tenantId, async (client) => {
      try {
        await client.query(
          `INSERT INTO system_metrics (name, value, tags, tenant_id, trace_id)
           VALUES ($1, $2, $3, $4, $5)`,
          [name, value, JSON.stringify(tags), ctx.tenantId, ctx.traceId]
        );
      } catch (err: any) {
        // Silent failure for metrics to keep worker running
        console.error('Failed to track metric:', name, err.message);
      }
    }).catch(() => {});
  },

  /**
   * Retrieves aggregated metrics for the dashboard.
   */
  async getSummary(tenantId: string, interval: string = '1 hour') {
    return await db.withTenant(tenantId, async (client) => {
      const { rows } = await client.query(`
        SELECT 
          name,
          COUNT(*) as count,
          AVG(value) as avg_value,
          SUM(value) as sum_value
        FROM system_metrics
        WHERE created_at > NOW() - INTERVAL $1
        GROUP BY name
      `, [interval]);
      return rows;
    });
  }
};
