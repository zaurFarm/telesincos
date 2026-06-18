export class ConfidenceScorer {
  static score(price: number, marketMedian: number, fraudRisk: number): number {
    let confidence = 100;
    
    // Penalize high fraud risk
    confidence -= fraudRisk;
    
    // Penalize strong deviation from median
    const deviation = Math.abs(marketMedian - price) / marketMedian;
    confidence -= deviation * 100;

    return Math.max(Math.min(Math.round(confidence), 100), 0);
  }
}
