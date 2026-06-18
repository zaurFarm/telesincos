export class EventPartitioner {
    static getStreamKeyForEntity(entityType: string, entityId: string): string {
        return `event_stream:${entityType}:${entityId}`;
    }
    
    static getGlobalStreamKey(domain: string): string {
        return `event_stream:global:${domain}`;
    }
}
