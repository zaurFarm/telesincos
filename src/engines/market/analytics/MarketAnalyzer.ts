export class MarketAnalyzer {
  static analyze(prices: number[]): { minPrice: number, avgPrice: number, medianPrice: number, trend: 'up' | 'down' | 'stable' } {
    if (prices.length === 0) return { minPrice: 0, avgPrice: 0, medianPrice: 0, trend: 'stable'};
    
    prices.sort((a, b) => a - b);
    const minPrice = prices[0];
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    const medianPrice = prices[Math.floor(prices.length / 2)];
    
    // Simplified trend calculation
    const isRecentLower = prices[prices.length - 1] < medianPrice; 
    const trend = isRecentLower ? 'down' : 'up'; // In reality requires time-series data
    
    return { minPrice, avgPrice, medianPrice, trend };
  }
}
