import { getDb } from '../../db.js';

export class OutboxEngine {
  /**
   * Submits an event to the Outbox table instead of publishing directly.
   * This guarantees transactional safety (Outbox Pattern).
   * It should be called within the SAME PostgreSQL transaction as the main state change.
   */
  static async append(
    eventType: string,
    payload: any,
    clientTransaction?: any // Represents a PG client in a real app
  ): Promise<void> {
    const db = clientTransaction || (await getDb());
    
    await db.run(
      `INSERT INTO outbox_events (event_type, payload, status) VALUES ($1, $2, 'pending')`,
      [eventType, JSON.stringify(payload)]
    );
    console.log(`[OutboxEngine] Appended event ${eventType} to outbox safely.`);
  }

  /**
   * Simulates a cron/worker process that reads pending outbox events and publishes them to Kafka/RabbitMQ.
   */
  static async processPendingEvents(): Promise<void> {
    // 1. SELECT * FROM outbox_events WHERE status = 'pending' FOR UPDATE SKIP LOCKED
    // 2. Publish to Kafka
    // 3. UPDATE outbox_events SET status = 'processed' WHERE id = ...
  }
}
