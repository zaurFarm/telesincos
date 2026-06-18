import { connection, hasRedisUrl } from '../../queue/redis.js';

type EventHandler<T> = (payload: T) => void;

export class AIEventBus {
  private static handlers = new Map<string, EventHandler<any>[]>();
  private static streamKey = 'ai_event_stream';
  private static isInitialized = false;

  private static async initConsumer() {
    if (this.isInitialized || !hasRedisUrl || process.env.DISABLE_WORKERS) return;
    this.isInitialized = true;
    
    // Ensure consumer group exists BEFORE starting the read loop (await, not fire-and-forget)
    await this.ensureGroup();

    const consumerName = `consumer_${process.pid}_${Math.random().toString(36).substr(2, 5)}`;
    
    const readStream = async () => {
      try {
        const result = await connection.xreadgroup(
          'GROUP', 'system_group', consumerName,
          'BLOCK', 5000,
          'STREAMS', this.streamKey, '>'
        );
        
        if (result && result.length > 0) {
          const stream = result[0];
          const messages = stream[1];
          for (const msg of messages) {
            const [id, fields] = msg;
            
            // parse fields array [ 'event', '...', 'payload', '...' ]
            let event = '';
            let payloadStr = '';
            for (let i = 0; i < fields.length; i += 2) {
               if (fields[i] === 'event') event = fields[i+1];
               if (fields[i] === 'payload') payloadStr = fields[i+1];
            }
            
            if (event && payloadStr) {
               const payload = JSON.parse(payloadStr);
               this.dispatchLocal(event, payload);
            }
            // Acknowledge message
            await connection.xack(this.streamKey, 'system_group', id);
          }
        }
      } catch (e: any) {
        // Self-heal: if the group/stream disappeared, recreate it instead of spamming errors
        if (e && e.message && e.message.includes('NOGROUP')) {
          await this.ensureGroup();
        } else {
          console.error('Error reading from event stream', e);
        }
      } finally {
        setTimeout(readStream, 50); // loop
      }
    };
    
    setTimeout(readStream, 100);
  }

  // Create the consumer group, tolerating the case where it already exists.
  private static async ensureGroup() {
    try {
      await connection.xgroup('CREATE', this.streamKey, 'system_group', '$', 'MKSTREAM');
    } catch (e: any) {
      if (!e.message.includes('BUSYGROUP')) {
        console.error('Failed to create consumer group', e);
      }
    }
  }

  static on<T>(event: string, handler: EventHandler<T>) {
    AIEventBus.initConsumer();
    const current = this.handlers.get(event) || [];
    current.push(handler);
    this.handlers.set(event, current);
    
    return () => {
      this.off(event, handler);
    };
  }
  
  static off<T>(event: string, handler: EventHandler<T>) {
    const current = this.handlers.get(event);
    if (current) {
        this.handlers.set(event, current.filter(h => h !== handler));
    }
  }

  static async emit<T>(event: string, payload: T) {
    if (hasRedisUrl && !process.env.DISABLE_WORKERS) {
      // Distributed emit
      try {
        await connection.xadd(
          this.streamKey,
          '*',
          'event', event,
          'payload', JSON.stringify(payload)
        );
      } catch (e) {
        console.error(`Failed to publish event ${event} to Redis stream`, e);
      }
    } else {
      // Local fallback emit
      this.dispatchLocal(event, payload);
    }
  }

  private static dispatchLocal(event: string, payload: any) {
    const handlers = this.handlers.get(event);
    if (!handlers) return;

    for (const h of handlers) {
      try {
        h(payload);
      } catch (e) {
        console.error(`AIEventBus handler failed for event ${event}`, e);
      }
    }
  }
}
