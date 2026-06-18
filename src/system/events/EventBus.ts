// STAGE 8 - Cognitive Event Bus

export enum AI_EVENT {
  CLIENT_REPLY = 'CLIENT_REPLY',
  RISK_DETECTED = 'RISK_DETECTED',
  MARKET_SHIFT = 'MARKET_SHIFT',
  DEAL_STALLED = 'DEAL_STALLED',
  INTENT_SPIKE = 'INTENT_SPIKE'
}

type EventCallback = (payload: any) => void;

class CognitiveEventBusImpl {
  private listeners: Map<string, EventCallback[]> = new Map();

  subscribe(event: AI_EVENT | string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
    return () => this.unsubscribe(event, callback);
  }

  unsubscribe(event: AI_EVENT | string, callback: EventCallback) {
    if (!this.listeners.has(event)) return;
    this.listeners.set(event, this.listeners.get(event)!.filter(cb => cb !== callback));
  }

  dispatch(event: AI_EVENT | string, payload?: any) {
    console.log(`[Cognitive Event Bus] 🚀 ${event}`, payload || '');
    if (this.listeners.has(event)) {
      this.listeners.get(event)!.forEach(cb => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[Cognitive Event Bus] Error processing event ${event}:`, e);
        }
      });
    }
  }
}

export const CognitiveEventBus = new CognitiveEventBusImpl();
