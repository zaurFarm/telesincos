export type DealState =
  | 'NEW'
  | 'DISCOVERY'
  | 'QUALIFICATION'
  | 'INTEREST'
  | 'CONSIDERATION'
  | 'NEGOTIATION'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_VERIFICATION'
  | 'FULFILLMENT'
  | 'WON'
  | 'LOST'
  | 'PAUSED'
  | 'HANDOFF';

export interface DealContext {
  state: DealState;
  intentScore: number;
  trustScore: number;
  riskLevel: number;
  lastClientMessageAt: number;
  lastAgentMessageAt: number;
  objections: string[];
  discussedProducts: string[];
  proposedPrice?: number;
  approvedDiscount?: number;
  paymentRequested?: boolean;
  paymentConfirmed?: boolean;
  handoffReason?: string;
}

export interface TransitionSignal {
  intentScore?: number;
  riskScore?: number;
  trustScore?: number;
  objectionDetected?: boolean;
  paymentRequested?: boolean;
  paymentConfirmed?: boolean;
  timeout?: boolean;
  competitorMentioned?: boolean;
}

export class DealStateMachine {
  static transition(ctx: DealContext, signal: TransitionSignal): DealContext {
    const nextCtx = { ...ctx };

    // Update base metrics if provided in signal
    if (signal.intentScore !== undefined) nextCtx.intentScore = signal.intentScore;
    if (signal.riskScore !== undefined) nextCtx.riskLevel = signal.riskScore;
    if (signal.trustScore !== undefined) nextCtx.trustScore = signal.trustScore;
    if (signal.paymentRequested !== undefined) nextCtx.paymentRequested = signal.paymentRequested;
    if (signal.paymentConfirmed !== undefined) nextCtx.paymentConfirmed = signal.paymentConfirmed;

    switch (ctx.state) {
      case 'NEW':
      case 'DISCOVERY':
        if ((signal.intentScore || ctx.intentScore) > 0.5) {
          nextCtx.state = 'INTEREST';
        }
        break;

      case 'INTEREST':
        if (signal.objectionDetected) {
          nextCtx.state = 'CONSIDERATION';
        } else if ((signal.intentScore || ctx.intentScore) > 0.8) {
          nextCtx.state = 'NEGOTIATION';
        }
        break;

      case 'CONSIDERATION':
        if ((signal.intentScore || ctx.intentScore) > 0.8 && !signal.objectionDetected) {
          nextCtx.state = 'NEGOTIATION';
        }
        break;

      case 'NEGOTIATION':
        if (signal.paymentRequested || nextCtx.paymentRequested) {
          nextCtx.state = 'PAYMENT_PENDING';
        }
        if ((signal.riskScore || ctx.riskLevel) > 80) {
           nextCtx.state = 'HANDOFF';
           nextCtx.handoffReason = 'High risk detected during negotiation';
        }
        break;

      case 'PAYMENT_PENDING':
        if (signal.paymentConfirmed || nextCtx.paymentConfirmed) {
          nextCtx.state = 'FULFILLMENT';
        } else if (signal.timeout) {
          nextCtx.state = 'CONSIDERATION'; // Back to consideration if payment times out
        }
        break;
        
      case 'FULFILLMENT':
         // fulfillment logic e.g., tracking delivery, updating to WON
         nextCtx.state = 'WON';
         break;
    }

    return nextCtx;
  }
}
