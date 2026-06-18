export class HumanApprovalGate {
  static requiresApproval(action: string) {
    return [
      'DISCOUNT_OVER_20',
      'PAYMENT_OVERRIDE',
      'MANUAL_REFUND'
    ].includes(action);
  }
}
