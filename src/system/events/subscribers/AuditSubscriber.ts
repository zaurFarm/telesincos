import { AIEventBus } from '../AIEventBus';
import { DEAL_EVENTS, DealStateChangedPayload } from '../events/DealEvents';
import { RISK_EVENTS, RiskAlertPayload } from '../events/RiskEvents';
import { MARKET_EVENTS, MarketPriceUpdatedPayload } from '../events/MarketEvents';
import { GlobalEventStore } from '../store/EventStore';

export interface AuditEntry {
  id: string;
  type: string;
  timestamp: number;
  data: any;
}

class AuditStore {
  private logs: AuditEntry[] = [];
  
  add(type: string, data: any) {
    this.logs.unshift({
      id: Math.random().toString(36).substring(7),
      type,
      timestamp: Date.now(),
      data
    });
    // Keep last 1000 logs
    if (this.logs.length > 1000) {
      this.logs.pop();
    }
  }
  
  getLogs() {
     return this.logs;
  }
}

export const GlobalAuditStore = new AuditStore();

export function initAuditSubscriber() {
  AIEventBus.on<DealStateChangedPayload>(DEAL_EVENTS.STATE_CHANGED, (payload) => {
    GlobalAuditStore.add(DEAL_EVENTS.STATE_CHANGED, payload);
    GlobalEventStore.append(DEAL_EVENTS.STATE_CHANGED, payload, { dealId: payload.dealId });
    console.log(`[AUDIT] Deal ${payload.dealId} changed state: ${payload.previousState} -> ${payload.newState}`);
  });
  
  AIEventBus.on<RiskAlertPayload>(RISK_EVENTS.ALERT, (payload) => {
    GlobalAuditStore.add(RISK_EVENTS.ALERT, payload);
    GlobalEventStore.append(RISK_EVENTS.ALERT, payload, { dealId: payload.dealId, userId: payload.clientId });
    console.warn(`[AUDIT] High risk detected for deal ${payload.dealId}: ${payload.reason}`);
  });

  AIEventBus.on<MarketPriceUpdatedPayload>(MARKET_EVENTS.PRICE_UPDATED, (payload) => {
    GlobalAuditStore.add(MARKET_EVENTS.PRICE_UPDATED, payload);
    GlobalEventStore.append(MARKET_EVENTS.PRICE_UPDATED, payload);
    console.log(`[AUDIT] Market price updated for ${payload.productId}: ${payload.oldPrice} -> ${payload.newPrice}`);
  });
}
