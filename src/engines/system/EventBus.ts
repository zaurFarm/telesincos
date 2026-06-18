// Simulates Kafka / RabbitMQ integration for Event Driven Architecture
import { OutboxEngine } from './OutboxEngine.js';

export type EmittedEvent = 'OrderCreated' | 'PriceChanged' | 'SupplierConfirmed' | 'StockReserved' | 'CatalogDraftCreated';

export class EventBus {
  /**
   * For Enterprise consistency, direct publishing is discouraged for state changes.
   * Use OutboxEngine.append() inside the DB transaction, and the background worker will call this.
   */
  static async publish(eventType: EmittedEvent, payload: any): Promise<void> {
    console.log(`[EventBus] Publishing topic [${eventType}] to CDC/Kafka:`, JSON.stringify(payload));
    
    // Simulating BullMQ or Kafka producer push
    // await kafkaProducer.send({ topic: eventType, messages: [payload] });
  }

  /**
   * Subscribe to topic (Worker implementation)
   */
  static subscribe(eventType: EmittedEvent, handler: (payload: any) => Promise<void>): void {
    console.log(`[EventBus] Worker subscribed to topic [${eventType}]`);
    // Simulating consumer
  }
}
