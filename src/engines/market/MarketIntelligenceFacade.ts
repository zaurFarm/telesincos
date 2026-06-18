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
    
    // 2. Scan Market — pull real competitor prices collected from Telegram messages
    const { db } = await import('../../db.js');
    let rawMarketPrices: number[] = [];
    try {
      const res = await db.query(
        `SELECT price FROM competitor_data
         WHERE product_text ILIKE $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [`%${sku}%`]
      );
      rawMarketPrices = (res.rows || [])
        .map((r: any) => Number(String(r.price).replace(/[^\d.]/g, '')))
        .filter((n: number) => n > 0);
    } catch (e: any) {
      console.error('[MarketIntelligence] Failed to read competitor_data:', e.message);
    }

    // No market data yet → return a neutral context based purely on the system price
    if (rawMarketPrices.length === 0) {
      const demandNoData = DemandEngine.calculateDemand(integrationData?.stock || 0, 150, integrationData?.salesVelocity || 0);
      const proposedNoData = DynamicPricingEngine.calculateOptimalPrice(currentSystemPrice, demandNoData, (integrationData?.stock || 0) < 50, 'stable');
      const policyNoData = PricingPolicyEngine.checkPolicyConstraints(proposedNoData, purchasePrice);
      return {
        marketTrend: 'stable',
        marketMedian: currentSystemPrice,
        verifiedLowestPrice: null,
        recommendedPrice: policyNoData.fixedPrice,
        demand: demandNoData,
      };
    }

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
