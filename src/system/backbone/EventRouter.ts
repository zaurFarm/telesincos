import { connection, hasRedisUrl } from '../../queue/redis.js';

export class EventRouter {
   static async routeEvent(streamKey: string, eventName: string, serializedPayload: string) {
       if (!hasRedisUrl || process.env.DISABLE_WORKERS) {
           return; 
       }
       
       try {
           await connection.xadd(
               streamKey,
               '*',
               'event', eventName,
               'payload', serializedPayload
           );
       } catch (e) {
           console.error('[EventRouter] Routing failed', e);
       }
   }
}
