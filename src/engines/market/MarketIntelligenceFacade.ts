import { ProductMatcher } from './normalization/ProductMatcher';
import { MarketAnalyzer } from './analytics/MarketAnalyzer';
import { DemandEngine } from './analytics/DemandEngine';
import { OneCIntegration } from './integrations/OneCIntegration';
import { PricingPolicyEngine } from './pricing/PricingPolicyEngine';
import { DynamicPricingEngine } from './pricing/DynamicPricingEngine';
import { FraudPriceDetector } from './validation/FraudPriceDetector';
import { ConfidenceScorer } from './validation/ConfidenceScorer';

export interface MarketContext {
  marketTrend: 'up' | 'down' | 'stable';
  marketMedian: number;
  verifiedLowestPrice: number | null;
  recommendedPrice: number;
  demand: 'high' | 'normal' | 'low';
}

export class MarketIntelligenceFacade {
  static async getMarketContext(rawProductQuery: string, currentSystemPrice: number): Promise<MarketContext> {
    const sku = ProductMatcher.normalize(rawProductQuery);
    
    // 1. Fetch Integration Data (Purchase Price, Stock)
    const integrationData = await OneCIntegration.fetchProductData(sku);
    const purchasePrice = integrationData?.purchasePrice || (currentSystemPrice * 0.7); // Mock fallback
    
    // 2. Scan Market (Mocked prices)
    const rawMarketPrices = [340, 350, 360, 200, 330]; // 200 is suspicious
    const marketMedian = MarketAnalyzer.analyze(rawMarketPrices).medianPrice;
    
    // 3. Filter and Validate
    let validPrices: number[] = [];
    for (const p of rawMarketPrices) {
      const fraudRisk = FraudPriceDetector.calculateFraudRisk(p, marketMedian, 30, 5);
      const confidence = ConfidenceScorer.score(p, marketMedian, fraudRisk);
      if (confidence > 60) {
         validPrices.push(p);
      }
    }
    
    // 4. Analytics
    const { minPrice: verifiedLowestPrice, trend } = MarketAnalyzer.analyze(validPrices);
    const demand = DemandEngine.calculateDemand(integrationData?.stock || 0, 150, integrationData?.salesVelocity || 0);
    
    // 5. Pricing Engine
    const proposedByAI = DynamicPricingEngine.calculateOptimalPrice(currentSystemPrice, demand, (integrationData?.stock || 0) < 50, trend);
    const policyResult = PricingPolicyEngine.checkPolicyConstraints(proposedByAI, purchasePrice);
    
    return {
      marketTrend: trend,
      marketMedian,
      verifiedLowestPrice: validPrices.length > 0 ? verifiedLowestPrice : null,
      recommendedPrice: policyResult.fixedPrice,
      demand
    };
  }
}
