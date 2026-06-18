export class FraudPriceDetector {
  static calculateFraudRisk(price: number, marketMedian: number, sellerAgeDays: number, replies: number): number {
    let risk = 0;
    
    if (sellerAgeDays < 14) risk += 40;
    if (replies === 0) risk += 30;
    
    const deviation = Math.abs(marketMedian - price) / marketMedian;
    if (deviation > 0.5) risk += 50;
    
    return Math.min(risk, 100);
  }
}
