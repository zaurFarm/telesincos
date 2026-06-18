import { connection, hasRedisUrl } from '../../queue/redis.js';
import { EventSerializer } from '../backbone/EventSerializer.js';

export interface PersistedEvent<T = any> {
    id: string;
    version: number;
    type: string;
    data: T;
}

export class StreamStore {
    static async appendEvent(streamId: string, eventType: string, data: any, version: number) {
         if (!hasRedisUrl || process.env.DISABLE_WORKERS) return;
         
         const payload = EventSerializer.serialize(data);
         await connection.xadd(
             `stream:${streamId}`,
             '*',
             'type', eventType,
             'version', version.toString(),
             'data', payload
         );
    }
    
    static async readStream(streamId: string): Promise<PersistedEvent[]> {
        return this.readStreamAfterVersion(streamId, 0);
    }

    static async readStreamAfterVersion(streamId: string, fromVersion: number): Promise<PersistedEvent[]> {
         if (!hasRedisUrl || process.env.DISABLE_WORKERS) return [];
         
         const results = await connection.xrange(`stream:${streamId}`, '-', '+');
         const events: PersistedEvent[] = results.map((msg: any) => {
             const fields = msg[1];
             let type = '';
             let dataStr = '';
             let version = 0;
             for (let i = 0; i < fields.length; i+=2) {
                 if (fields[i] === 'type') type = fields[i+1];
                 if (fields[i] === 'data') dataStr = fields[i+1];
                 if (fields[i] === 'version') version = parseInt(fields[i+1], 10);
             }
             return {
                 id: msg[0], // e.g. "1619472394712-0"
                 version,
                 type,
                 data: EventSerializer.deserialize(dataStr)
             };
         });

         return events.filter(e => e.version > fromVersion);
    }
}
