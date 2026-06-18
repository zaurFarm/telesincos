import { StreamStore } from './StreamStore.js';

export class TemporalDebugger {
    static async replayToTime(streamId: string, timestampMs: number) {
        const allEvents = await StreamStore.readStream(streamId);
        
        const filtered = allEvents.filter((e: any) => {
            const timePart = parseInt(e.id.split('-')[0], 10);
            return timePart <= timestampMs;
        });
        
        return filtered;
    }
}
