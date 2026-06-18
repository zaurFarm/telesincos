import { AIEventBus } from '../AIEventBus';
import { DEAL_EVENTS } from '../events/DealEvents';
import { RISK_EVENTS } from '../events/RiskEvents';
import { MARKET_EVENTS } from '../events/MarketEvents';
import { TIMELINE_EVENTS } from '../events/TimelineEvents';

export function initDashboardSubscriber() {
    // In a real environment, this subscriber would pipe events to WebSockets or an external pub/sub.
    // For our React frontend, we broadcast CustomEvents.
    
    const broadcast = (type: string, payload: any) => {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('dashboard:update', { 
                detail: { type, payload }
            }));
        }
    };

    AIEventBus.on(DEAL_EVENTS.STATE_CHANGED, (payload) => broadcast(DEAL_EVENTS.STATE_CHANGED, payload));
    AIEventBus.on(RISK_EVENTS.ALERT, (payload) => broadcast(RISK_EVENTS.ALERT, payload));
    AIEventBus.on(MARKET_EVENTS.PRICE_UPDATED, (payload) => broadcast(MARKET_EVENTS.PRICE_UPDATED, payload));
    AIEventBus.on(TIMELINE_EVENTS.CLIENT_REPLY, (payload) => broadcast(TIMELINE_EVENTS.CLIENT_REPLY, payload));
}
