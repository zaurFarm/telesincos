import { DealContext } from '../../../engines/negotiation/DealStateMachine';

export const DEAL_EVENTS = {
    STATE_CHANGED: 'DEAL_STATE_CHANGED',
    WON: 'DEAL_WON',
    LOST: 'DEAL_LOST',
    HANDOFF_TRIGGERED: 'DEAL_HANDOFF_TRIGGERED'
} as const;

export interface DealStateChangedPayload {
    dealId: string;
    previousState: string;
    newState: string;
    context: DealContext;
    timestamp: number;
}
