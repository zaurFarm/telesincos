export enum Capability {
  READ_DEAL = 'READ_DEAL',
  READ_MARKET = 'READ_MARKET',
  SUGGEST_PRICE = 'SUGGEST_PRICE',
  SET_PRICE = 'SET_PRICE', // Usually denied to AI
  APPROVE_DISCOUNT = 'APPROVE_DISCOUNT',
  SEND_MESSAGE = 'SEND_MESSAGE',
  CONFIRM_PAYMENT = 'CONFIRM_PAYMENT', // Hard denied to AI
  TRIGGER_HANDOFF = 'TRIGGER_HANDOFF'
}

export class CapabilityGate {
  private aiCapabilities: Set<Capability>;

  constructor() {
    this.aiCapabilities = new Set([
      Capability.READ_DEAL,
      Capability.READ_MARKET,
      Capability.SUGGEST_PRICE,
      Capability.SEND_MESSAGE,
      Capability.TRIGGER_HANDOFF
    ]);
  }

  canAI(capability: Capability): boolean {
    return this.aiCapabilities.has(capability);
  }

  validateOrThrow(capability: Capability) {
    if (!this.canAI(capability)) {
      throw new Error(`Capability Denied: AI is not permitted to perform ${capability}. Escalate to human operator.`);
    }
  }
}

export const GlobalCapabilityGate = new CapabilityGate();
