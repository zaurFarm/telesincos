import { StreamStore } from './StreamStore.js';
import { SnapshotStore, AggregateSnapshot } from './SnapshotStore.js';

export interface AggregateRoot {
    id: string;
    version: number;
    uncommittedEvents: any[];
}

export abstract class BaseAggregate<TState = any> implements AggregateRoot {
    id: string;
    version: number = 0;
    uncommittedEvents: any[] = [];
    
    constructor(id: string) {
        this.id = id;
    }
    
    protected applyChange(event: any, isNew: boolean = true) {
        this.mutate(event);
        if (isNew) {
            this.uncommittedEvents.push({ ...event, version: this.version + 1 });
        }
        this.version++;
    }
    
    protected abstract mutate(event: any): void;
    
    abstract getState(): TState;
    abstract setState(state: TState): void;

    async commit(streamCategory: string) {
        for (const event of this.uncommittedEvents) {
            await StreamStore.appendEvent(`${streamCategory}:${this.id}`, event.type, event.payload, event.version);
        }
        this.uncommittedEvents = [];
        
        // Take a snapshot every 100 events
        if (this.version % 100 === 0) {
            const snapshot: AggregateSnapshot<TState> = {
                aggregateId: this.id,
                version: this.version,
                createdAt: Date.now(),
                state: this.getState()
            };
            await SnapshotStore.save(this.id, snapshot);
        }
    }
    
    async hydrate(streamCategory: string) {
        const streamId = `${streamCategory}:${this.id}`;
        
        // 1. Load from snapshot if available
        const snapshot = await SnapshotStore.load<TState>(this.id);
        let fromVersion = 0;
        
        if (snapshot) {
            this.setState(snapshot.state);
            this.version = snapshot.version;
            fromVersion = snapshot.version;
        }

        // 2. Load events after the snapshot version
        const history = await StreamStore.readStreamAfterVersion(streamId, fromVersion);
        for (const rawEvent of history) {
            this.applyChange({ type: rawEvent.type, payload: rawEvent.data, version: rawEvent.version }, false);
        }
    }
}
