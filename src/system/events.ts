import { db } from '../db.js';
import { logger } from './logger.js';

export interface SystemEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

export async function emitEvent(type: string, payload: any) {
  const event: SystemEvent = {
    id: Math.random().toString(36).substring(7),
    type,
    payload,
    timestamp: Date.now()
  };

  try {
    const query = `
      CREATE TABLE IF NOT EXISTS event_store (
        id TEXT PRIMARY KEY,
        type TEXT,
        payload JSONB,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `;
    await db.query(query);

    await db.query(
      `INSERT INTO event_store (id, type, payload, timestamp) VALUES ($1, $2, $3, to_timestamp($4 / 1000.0))`,
      [event.id, event.type, JSON.stringify(event.payload), event.timestamp]
    );

  } catch (e) {
    logger.error({ type: 'event_store_error', error: String(e) });
  }

  return event;
}
