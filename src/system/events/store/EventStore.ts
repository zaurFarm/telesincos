export interface StoredEvent<T = any> {
  id: string;
  type: string;
  payload: T;
  timestamp: number;
  correlationId?: string;
  dealId?: string;
  userId?: string;
}

export interface IEventStore {
    append(eventType: string, payload: any, metadata?: { correlationId?: string, dealId?: string, userId?: string }): Promise<void>;
    getEventsForDeal(dealId: string): Promise<StoredEvent[]>;
    getAllEvents(limit?: number): Promise<StoredEvent[]>;
}

// In-memory store for MVP/Dev phase.
// In production, this would be PostgresEventStore using PL/pgSQL & TimescaleDB or simple JSONB append-only table.
export class InMemoryEventStore implements IEventStore {
    private events: StoredEvent[] = [];

    async append(type: string, payload: any, metadata?: { correlationId?: string, dealId?: string, userId?: string }): Promise<void> {
        const event: StoredEvent = {
            id: crypto.randomUUID(),
            type,
            payload,
            timestamp: Date.now(),
            ...metadata
        };
        this.events.push(event);
    }

    async getEventsForDeal(dealId: string): Promise<StoredEvent[]> {
        return this.events.filter(e => e.dealId === dealId).sort((a, b) => a.timestamp - b.timestamp);
    }

    async getAllEvents(limit: number = 1000): Promise<StoredEvent[]> {
        return this.events.slice(-limit);
    }
}

export const GlobalEventStore = new InMemoryEventStore();
