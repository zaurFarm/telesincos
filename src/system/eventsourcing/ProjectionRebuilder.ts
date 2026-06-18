import { StreamStore } from './StreamStore.js';
import { StructuredLogger } from '../../runtime/observability/StructuredLogger.js';

export class ProjectionRebuilder {
    static async rebuildStateFromStreams(streamCategory: string, onEvent: (event: any) => Promise<void>) {
        StructuredLogger.info(`[ProjectionRebuilder] Starting rebuild for category: ${streamCategory}`);

        // Ideally this lists all stream keys for the category and replays them.
        // For demonstration, we simulate replaying a single generic stream here.
        // In a production system you would iterate through known keys or maintain a registry.

        try {
            const allEvents = await StreamStore.readStreamAfterVersion(`global:${streamCategory}`, 0);
            
            for (const evt of allEvents) {
                await onEvent(evt);
            }
            
            StructuredLogger.info(`[ProjectionRebuilder] Rebuilt ${allEvents.length} events for ${streamCategory}`);
        } catch (e) {
             StructuredLogger.error(`[ProjectionRebuilder] Failed to rebuild state for ${streamCategory}`, e);
        }
    }
}
