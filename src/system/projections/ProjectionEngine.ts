import { AIEventBus } from '../events/AIEventBus';
import { GlobalDealProjection } from './DealProjection';
import { DEAL_EVENTS } from '../events/events/DealEvents.js';

export class ProjectionEngine {
    constructor() {
       this.bindEvents();
    }

    private bindEvents() {
        AIEventBus.on(DEAL_EVENTS.STATE_CHANGED, (payload: any) => {
            GlobalDealProjection.applyEvent({
                type: DEAL_EVENTS.STATE_CHANGED,
                payload,
                timestamp: Date.now()
            });
        });
    }
}
export const GlobalProjectionEngine = new ProjectionEngine();
