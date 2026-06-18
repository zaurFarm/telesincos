import { AuditEngine } from '../system/AuditEngine.js';

export class MarginControlEngine {
  
  static RULES = {
    max_discount_percent: 7,
    min_margin_percent: 15,
    approval_required_after: 10
  };

  /**
   * Safe discount calculator
   */
  static async calculateSafeDiscount(
    productId: string,
    requestedDiscountPercent: number,
    costPrice: number,
    logistics: number,
    commission: number
  ): Promise<{ approved: boolean; finalDiscount: number; requiresHuman: boolean }> {
    
    // Check hard caps
    if (requestedDiscountPercent > this.RULES.max_discount_percent) {
       await AuditEngine.log('AIAgent', 'AIAgent', 'margin_check_failed', { reason: 'max_discount_exceeded', req: requestedDiscountPercent });
       return { approved: false, finalDiscount: 0, requiresHuman: false };
    }

    const currentPrice = costPrice + logistics + commission; 
    // Simplified: in reality margin calculation = (Price - Costs) / Price
    
    const requiresHuman = requestedDiscountPercent >= this.RULES.approval_required_after;

    if (requiresHuman) {
      await AuditEngine.log('AIAgent', 'AIAgent', 'human_approval_requested', { productId, discount: requestedDiscountPercent });
    }

    return { 
      approved: !requiresHuman, // If requires human, it's not auto-approved yet
      finalDiscount: requiresHuman ? 0 : requestedDiscountPercent,
      requiresHuman
    };
  }
}
