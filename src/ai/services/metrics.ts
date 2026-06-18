import { db } from '../../db.js';

export interface Metric {
  userId?: string | number;
  chatId?: string | number;
  event: string;
  value?: number;
  meta?: any;
}

export async function logMetric(metric: Metric) {
  try {
    await db.query(
      `INSERT INTO sales_metrics (user_id, chat_id, event, value, meta) VALUES ($1, $2, $3, $4, $5)`,
      [
        metric.userId ? String(metric.userId) : null,
        metric.chatId ? String(metric.chatId) : null,
        metric.event,
        metric.value || null,
        metric.meta ? JSON.stringify(metric.meta) : null
      ]
    );
  } catch(e) {
    console.error('Failed to log metric', e);
  }
}
