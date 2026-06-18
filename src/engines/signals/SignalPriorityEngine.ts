import { AIEventBus } from '../../system/events/AIEventBus';
import { DEAL_EVENTS, DealStateChangedPayload } from '../../system/events/events/DealEvents';
import { RISK_EVENTS, RiskAlertPayload } from '../../system/events/events/RiskEvents';
import { MARKET_EVENTS, MarketPriceUpdatedPayload } from '../../system/events/events/MarketEvents';
import { TIMELINE_EVENTS, ClientReplyPayload } from '../../system/events/events/TimelineEvents';
import { Signal } from './SignalTypes';
import { SignalDeduplicator } from './SignalDeduplicator';
import { SignalDecayModel } from './SignalDecayModel';

export class SignalPriorityEngine {
    private signals: Signal[] = [];
    
    constructor() {
        this.bindEvents();
        setInterval(() => this.pruneSignals(), 60000);
    }

    private bindEvents() {
        AIEventBus.on<RiskAlertPayload>(RISK_EVENTS.ALERT, (payload) => {
           this.processSignal({
               id: crypto.randomUUID(),
               type: RISK_EVENTS.ALERT,
               priority: payload.riskScore > 80 ? 95 : 60,
               timestamp: Date.now(),
               payload,
               count: 1,
               dealId: payload.dealId
           });
        });

        AIEventBus.on<DealStateChangedPayload>(DEAL_EVENTS.STATE_CHANGED, (payload) => {
            const urgency = payload.newState === 'HANDOFF' ? 90 : 
                            payload.newState === 'PAYMENT_PENDING' ? 70 : 40;
            this.processSignal({
                id: crypto.randomUUID(),
                type: DEAL_EVENTS.STATE_CHANGED,
                priority: urgency,
                timestamp: Date.now(),
                payload,
                count: 1,
                dealId: payload.dealId
            });
        });

        AIEventBus.on<MarketPriceUpdatedPayload>(MARKET_EVENTS.PRICE_UPDATED, (payload) => {
            const drop = (payload.oldPrice - payload.newPrice) / payload.oldPrice;
            const priority = drop > 0.1 ? 65 : 20;
            if (priority > 30) {
               this.processSignal({
                   id: crypto.randomUUID(),
                   type: MARKET_EVENTS.PRICE_UPDATED,
                   priority,
                   timestamp: Date.now(),
                   payload,
                   count: 1,
               });
            }
        });

        AIEventBus.on<ClientReplyPayload>(TIMELINE_EVENTS.CLIENT_REPLY, (payload) => {
             this.processSignal({
                 id: crypto.randomUUID(),
                 type: TIMELINE_EVENTS.CLIENT_REPLY,
                 priority: 10,
                 timestamp: Date.now(),
                 payload,
                 count: 1,
                 dealId: payload.dealId
             });
        });
    }

    private processSignal(newSignal: Signal) {
        this.signals = SignalDeduplicator.deduplicate(this.signals, newSignal);
        this.broadcast();
    }

    public getActiveSignals(): Signal[] {
        const now = Date.now();
        return this.signals
            .map(s => ({
                ...s,
                priority: SignalDecayModel.calculateDecayedPriority(s, now)
            }))
            .filter(s => s.priority > 5)
            .sort((a, b) => b.priority - a.priority);
    }

    private pruneSignals() {
       const now = Date.now();
       this.signals = this.signals.filter(s => SignalDecayModel.calculateDecayedPriority(s, now) > 5);
       this.broadcast();
    }
    
    private broadcast() {
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('signals:updated', { 
                detail: this.getActiveSignals() 
            }));
        }
    }
}

export const GlobalSignalEngine = new SignalPriorityEngine();
