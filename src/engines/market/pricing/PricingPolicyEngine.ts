export class PricingPolicyEngine {
  static checkPolicyConstraints(proposedPrice: number, purchasePrice: number): { compliant: boolean, fixedPrice: number } {
    const MIN_MARGIN = 0.18; // 18%
    const minProfitablePrice = purchasePrice * (1 + MIN_MARGIN);
    
    if (proposedPrice < minProfitablePrice) {
      return { compliant: false, fixedPrice: minProfitablePrice };
    }
    
    return { compliant: true, fixedPrice: proposedPrice };
  }
}
