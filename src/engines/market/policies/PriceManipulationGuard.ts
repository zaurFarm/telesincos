import { CognitiveContext } from '../../context/CognitiveContextBuilder';
import { MarginProtectionPolicy } from './MarginProtectionPolicy';
import { DiscountApprovalPolicy } from './DiscountApprovalPolicy';

export interface PriceRecommendation {
    recommendedPrice: number;
    recommendedDiscountLimit: number;
    urgencyLevel: 'normal' | 'high' | 'critical';
    isSafe: boolean;
    blockReason?: string;
}

export class PriceManipulationGuard {
    static evaluatePricingStrategy(
        ctx: CognitiveContext, 
        basePrice: number, 
        costPrice: number,
        llmSuggestedPrice?: number
    ): PriceRecommendation {
        
        let recommendedPrice = basePrice;
        let urgencyLevel: 'normal' | 'high' | 'critical' = 'normal';
        let recommendedDiscountLimit = 0.05; // 5% by default

        // 1. Analyze Market Pressure
        if (ctx.market) {
            if ((ctx.market.stockScarcity ?? 10) < 3) {
                urgencyLevel = 'critical';
                recommendedDiscountLimit = 0; // No discount when scarce
            }

            if ((ctx.market.competitorPressure ?? 0) > 0.7) {
                urgencyLevel = 'high';
                recommendedDiscountLimit = 0.15; // Allow more discount if pressure is high
            }
        }

        // 2. Validate LLM suggestions
        if (llmSuggestedPrice) {
            const marginSafe = MarginProtectionPolicy.validate(basePrice, costPrice, llmSuggestedPrice);
            if (!marginSafe) {
                return {
                    recommendedPrice: MarginProtectionPolicy.getMinimumAllowedPrice(costPrice),
                    recommendedDiscountLimit: 0,
                    urgencyLevel,
                    isSafe: false,
                    blockReason: 'LLM suggested price violates margin protection'
                };
            }

            const discountEval = DiscountApprovalPolicy.evaluate({
                originalPrice: basePrice,
                requestedPrice: llmSuggestedPrice,
                riskScore: ctx.risk.score,
                trustScore: ctx.memory.trustScore,
                competitorPresent: (ctx.market?.competitorPressure ?? 0) > 0.5
            });

            if (!discountEval.approved) {
                 return {
                    recommendedPrice: basePrice * (1 - recommendedDiscountLimit),
                    recommendedDiscountLimit,
                    urgencyLevel,
                    isSafe: false,
                    blockReason: `Discount rejected: ${discountEval.reason}`
                };
            }
            
            recommendedPrice = llmSuggestedPrice;
        }

        return {
            recommendedPrice,
            recommendedDiscountLimit,
            urgencyLevel,
            isSafe: true
        };
    }
}
