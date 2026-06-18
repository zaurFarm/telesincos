import { CognitiveStore, CognitiveAction } from './CognitiveReducer';
import { CognitiveEventBus } from './EventBus';

// STAGE 37 - WebSocket Cognitive Fabric
// This class manages SSE (Server-Sent Events) or WebSocket connections to the backend

export class RealtimeGateway {
    private eventSource: EventSource | null = null;
    private reconnectAttempts: number = 0;
    
    // Coalescing buffer
    private eventBuffer: CognitiveAction[] = [];
    private coalescingTimer: any = null;

    connect() {
        if (this.eventSource) return;

        // In a real app, this would be a WS or SSE endpoint
        // this.eventSource = new EventSource('/api/stream/cognitive');
        console.log('[RealtimeGateway] Connecting to cognitive fabric stream...');

        // Simulated connection
        setInterval(() => this.simulateRemoteEvent(), 15000);
    }

    private simulateRemoteEvent() {
        this.bufferEvent({
            type: 'SYNC_STATE',
            payload: { activeDeals: Math.floor(Math.random() * 50) },
            meta: { timestamp: Date.now(), source: 'remote' }
        });
    }

    // Coalescing to prevent Event Storm Collapse
    private bufferEvent(action: CognitiveAction) {
        this.eventBuffer.push(action);

        if (!this.coalescingTimer) {
            this.coalescingTimer = setTimeout(() => {
                this.flushEvents();
            }, 150); // Aggregate bursts over 150ms
        }
    }

    private flushEvents() {
        this.coalescingTimer = null;
        if (this.eventBuffer.length === 0) return;

        console.log(`[RealtimeGateway] Flushing burst of ${this.eventBuffer.length} events...`);
        
        // Coalescing logic: if there are multiple SYNC_STATE events, we just take the latest
        const latestSync = this.eventBuffer.filter(e => e.type === 'SYNC_STATE').pop();
        
        if (latestSync) {
            CognitiveStore.dispatch(latestSync);
        }

        // Send to event bus as well for isolated components
        this.eventBuffer.forEach(e => {
            CognitiveEventBus.dispatch(e.type, e.payload);
        });

        this.eventBuffer = [];
    }

    disconnect() {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
    }
}

export const cognitiveGateway = new RealtimeGateway();
