import client from 'prom-client';
import { db } from '../db.js';
import { connection } from '../queue/redis.js';
import { monitorEventLoopDelay } from 'perf_hooks';

const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ prefix: 'tg_ai_' });

export const event_loop_lag_mean_ms = new client.Gauge({
  name: 'event_loop_lag_mean_ms',
  help: 'Mean Event Loop Lag in milliseconds'
});

export const event_loop_lag_p99_ms = new client.Gauge({
  name: 'event_loop_lag_p99_ms',
  help: 'p99 Event Loop Lag in milliseconds'
});

export const telegram_messages_sent_total = new client.Counter({
  name: 'telegram_messages_sent_total',
  help: 'Total number of Telegram messages sent successfully',
  labelNames: ['tenant_id', 'account_id']
});

export const telegram_messages_failed_total = new client.Counter({
  name: 'telegram_messages_failed_total',
  help: 'Total number of Telegram message failures',
  labelNames: ['tenant_id', 'account_id', 'error_type']
});

export const telegram_floodwait_total = new client.Counter({
  name: 'telegram_floodwait_total',
  help: 'Total number of FLOOD_WAIT encounters',
  labelNames: ['tenant_id', 'account_id']
});

export const bullmq_jobs_active = new client.Gauge({
  name: 'bullmq_jobs_active',
  help: 'Number of active BullMQ jobs',
  labelNames: ['queue_name']
});

export const bullmq_jobs_failed = new client.Gauge({
  name: 'bullmq_jobs_failed',
  help: 'Number of failed BullMQ jobs',
  labelNames: ['queue_name']
});

export const bullmq_jobs_completed = new client.Gauge({
  name: 'bullmq_jobs_completed',
  help: 'Number of completed BullMQ jobs',
  labelNames: ['queue_name']
});

export const bullmq_jobs_waiting = new client.Gauge({
  name: 'bullmq_jobs_waiting',
  help: 'Number of waiting BullMQ jobs',
  labelNames: ['queue_name']
});

export const bullmq_jobs_delayed = new client.Gauge({
  name: 'bullmq_jobs_delayed',
  help: 'Number of delayed BullMQ jobs',
  labelNames: ['queue_name']
});

export const worker_uptime_seconds = new client.Gauge({
  name: 'worker_uptime_seconds',
  help: 'Worker process uptime in seconds',
  labelNames: ['process_id']
});

export const jobs_stalled_total = new client.Gauge({
  name: 'jobs_stalled_total',
  help: 'Number of stalled jobs in queues',
  labelNames: ['queue_name']
});

export const accounts_active = new client.Gauge({
  name: 'accounts_active',
  help: 'Number of ACTIVE accounts',
  labelNames: ['tenant_id']
});

export const accounts_cooling_down = new client.Gauge({
  name: 'accounts_cooling_down',
  help: 'Number of COOLING_DOWN accounts',
  labelNames: ['tenant_id']
});

export const accounts_banned = new client.Gauge({
  name: 'accounts_banned',
  help: 'Number of BANNED accounts',
  labelNames: ['tenant_id']
});

export const accounts_quarantined = new client.Gauge({
  name: 'accounts_quarantined',
  help: 'Number of QUARANTINED accounts',
  labelNames: ['tenant_id']
});

export const ai_requests_total = new client.Counter({
  name: 'ai_requests_total',
  help: 'Total number of AI requests',
  labelNames: ['tenant_id', 'model']
});

export const ai_errors_total = new client.Counter({
  name: 'ai_errors_total',
  help: 'Total number of AI errors',
  labelNames: ['tenant_id', 'model', 'error_type']
});

export async function getMetrics() {
  return await client.register.metrics();
}

export async function updateSystemMetricsSnapshot() {
  try {
    event_loop_lag_mean_ms.set(histogram.mean / 1e6);
    event_loop_lag_p99_ms.set(histogram.percentile(99) / 1e6);

    const accountStats = await Promise.race([
      db.query(`
        SELECT status, count(*) as count 
        FROM farm_accounts 
        GROUP BY status
      `),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('DB timeout')), 150))
    ]);
    
    // reset explicitly
    accounts_active.reset();
    accounts_cooling_down.reset();
    accounts_banned.reset();
    accounts_quarantined.reset();

    for (const row of accountStats.rows || []) {
      if (row.status === 'active') accounts_active.labels('tenant_1').set(parseInt(row.count));
      if (row.status === 'cooling_down') accounts_cooling_down.labels('tenant_1').set(parseInt(row.count));
      if (row.status === 'banned') accounts_banned.labels('tenant_1').set(parseInt(row.count));
      if (row.status === 'quarantined') accounts_quarantined.labels('tenant_1').set(parseInt(row.count));
    }
    
    // Attempt dynamic import to avoid circular dependencies
    try {
      worker_uptime_seconds.labels(process.pid.toString()).set(process.uptime());
      const { crmQueue, aiQueue, tgDlq, tgQueue } = await import('../queue/index.js');
      const queues = { crmQueue, aiQueue, tgDlq, tgQueue };
      for (const [name, q] of Object.entries(queues)) {
        if (!q) continue;
        const counts: any = await Promise.race([
          q.getJobCounts('active', 'failed', 'completed', 'waiting', 'delayed'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Queue timeout')), 150))
        ]);
        bullmq_jobs_active.labels(name).set(counts.active || 0);
        bullmq_jobs_failed.labels(name).set(counts.failed || 0);
        bullmq_jobs_completed.labels(name).set(counts.completed || 0);
        bullmq_jobs_waiting.labels(name).set(counts.waiting || 0);
        bullmq_jobs_delayed.labels(name).set(counts.delayed || 0);
      }
    } catch (e) {
      // Ignore if queues are not initialized or accessible in this process type
    }

  } catch(e) {
    console.error('Error updating account metrics', e);
  }
}
