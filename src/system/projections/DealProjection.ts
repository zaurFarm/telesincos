import { IEventStore } from '../events/store/EventStore';
import { DealContext } from '../../engines/negotiation/DealStateMachine';

export interface DealReadModel {
  id: string;
  context: DealContext;
  lastUpdate: number;
}

export class DealProjection {
    private deals: Map<string, DealReadModel> = new Map();

    applyEvent(event: any) {
       if (event.type === 'DEAL_STATE_CHANGED') {
           const payload = event.payload;
           this.deals.set(payload.dealId, {
               id: payload.dealId,
               context: payload.context,
               lastUpdate: event.timestamp
           });
       }
    }

    getDeal(id: string): DealReadModel | undefined {
        return this.deals.get(id);
    }

    getAllDeals(): DealReadModel[] {
        return Array.from(this.deals.values());
    }
}

export const GlobalDealProjection = new DealProjection();
