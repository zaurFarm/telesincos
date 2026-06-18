import { StreamStore, PersistedEvent } from './StreamStore.js';

export class TemporalReplayEngine {
    static async replayToTime(streamId: string, timestampMs: number): Promise<PersistedEvent[]> {
        const allEvents = await StreamStore.readStream(streamId);
        
        const filtered = allEvents.filter(e => {
            const timePart = parseInt(e.id.split('-')[0], 10);
            return timePart <= timestampMs;
        });
        
        return filtered;
    }

    static async replayToVersion(streamId: string, version: number): Promise<PersistedEvent[]> {
        const allEvents = await StreamStore.readStream(streamId);
        
        const filtered = allEvents.filter(e => {
            return e.version <= version;
        });
        
        return filtered;
    }
}
