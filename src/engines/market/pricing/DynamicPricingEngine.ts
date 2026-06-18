export class DynamicPricingEngine {
  static calculateOptimalPrice(currentPrice: number, demand: 'high' | 'normal' | 'low', stockLow: boolean, marketTrend: 'up' | 'down' | 'stable'): number {
    let optimalPrice = currentPrice;
    
    if (demand === 'high' && stockLow) {
      optimalPrice = currentPrice * 1.05; // Increase by 5%
    } else if (marketTrend === 'down' && demand === 'low') {
      optimalPrice = currentPrice * 0.97; // Decrease by 3%
    }
    
    return optimalPrice;
  }
}
