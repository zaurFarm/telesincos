import { IEventStore, StoredEvent } from './EventStore';

export class ReplayEngine {
    constructor(private store: IEventStore) {}

    async replayDeal(dealId: string) {
        const events = await this.store.getEventsForDeal(dealId);
        
        console.log(`Replaying deal ${dealId} - Total events: ${events.length}`);
        
        let currentState: any = {}; // This would be the DealContext reconstructed

        for (const event of events) {
            console.log(`[${new Date(event.timestamp).toISOString()}] ${event.type}:`, event.payload);
            // In a real system, you'd apply the event to a reducer here to rebuild state
            currentState = this.applyEvent(currentState, event);
        }

        return currentState;
    }

    private applyEvent(state: any, event: StoredEvent): any {
        // Implementation of reducer logic depending on event types
        switch (event.type) {
            case 'DEAL_STATE_CHANGED':
                return { ...state, ...event.payload.context };
            // Add other reducers taking event types from DEAL_EVENTS, etc.
            default:
                return state;
        }
    }
}
