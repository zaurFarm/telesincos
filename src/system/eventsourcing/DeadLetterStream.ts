import { connection, hasRedisUrl } from '../../queue/redis.js';

export class DeadLetterStream {
    static async sendToDeadLetter(streamCategory: string, streamId: string, eventId: string, errorInfo: any) {
         if (!hasRedisUrl || process.env.DISABLE_WORKERS) return;

         await connection.xadd(
             `deadletter:${streamCategory}`,
             '*',
             'original_stream', streamId,
             'original_event_id', eventId,
             'error', JSON.stringify(errorInfo),
             'timestamp', Date.now().toString()
         );
    }
}
