export type VerifiedTelemetryEvent = {
  id: string;
  type: string;
  timestamp: number;
  source: string;
  workerId?: string;
  causalChainId?: string;
  correlationId?: string;
  authoritative: true;
  payload: any;
};

type TelemetryListener = (event: VerifiedTelemetryEvent) => void;

class RuntimeTelemetryBusClass {
  private listeners: TelemetryListener[] = [];
  private history: VerifiedTelemetryEvent[] = [];
  private constantHistoryLimit = 1000;

  subscribe(listener: TelemetryListener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  emit(event: Omit<VerifiedTelemetryEvent, 'authoritative'>) {
    const verifiedEvent: VerifiedTelemetryEvent = {
      ...event,
      authoritative: true
    };
    
    this.history.push(verifiedEvent);
    if (this.history.length > this.constantHistoryLimit) {
      this.history.shift();
    }

    for (const listener of this.listeners) {
      try {
        listener(verifiedEvent);
      } catch (err) {
        console.error('[RuntimeTelemetryBus] Listener error', err);
      }
    }
  }

  getRecentEvents(count = 100): VerifiedTelemetryEvent[] {
    return this.history.slice(-count);
  }
}

export const RuntimeTelemetryBus = new RuntimeTelemetryBusClass();
