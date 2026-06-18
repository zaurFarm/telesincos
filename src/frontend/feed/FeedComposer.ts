import { Signal } from '../../engines/signals/SignalTypes';

export interface FeedItem {
  id: string;
  timestamp: number;
  priority: number;
  title: string;
  description: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  dealId?: string;
  metadata?: any;
}

export class FeedComposer {
  static composeFromSignal(signal: Signal): FeedItem | null {
    let title = '';
    let description = '';
    let type: FeedItem['type'] = 'info';

    switch (signal.type) {
      case 'RISK_ALERT':
        title = 'Risk Escalation Detected';
        description = signal.payload.reason || 'Anomalous behavior identified.';
        type = signal.priority > 80 ? 'alert' : 'warning';
        break;
      case 'DEAL_STATE_CHANGED':
        title = `Deal transitioned to ${signal.payload.newState}`;
        description = `State changed from ${signal.payload.previousState}`;
        type = signal.payload.newState === 'HANDOFF' ? 'warning' : 'info';
        break;
      case 'MARKET_PRICE_UPDATED':
        title = 'Market Pressure Detected';
        description = `Price dropped on ${signal.payload.productId} from ${signal.payload.oldPrice} to ${signal.payload.newPrice}`;
        type = 'alert';
        break;
      default:
        // Skip unknown signals for feed
        return null;
    }

    return {
      id: crypto.randomUUID(),
      timestamp: signal.timestamp,
      priority: signal.priority,
      title,
      description,
      type,
      dealId: signal.dealId,
      metadata: signal.payload
    };
  }
}
