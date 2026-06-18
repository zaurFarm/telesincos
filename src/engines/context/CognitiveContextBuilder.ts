import { DealContext } from '../negotiation/DealStateMachine';

export interface ExtractedFacts {
    budget?: number;
    timeline?: string;
    competitors?: string[];
    painPoints?: string[];
}

export type EnergyLevel = 'low' | 'neutral' | 'high' | 'frustrated';

export interface CognitiveContext {
  deal: DealContext;

  memory: {
    trustScore: number;
    extractedFacts: ExtractedFacts;
  };

  emotion: {
    energy: EnergyLevel;
  };

  market: {
    medianPrice?: number;
    lowestVerifiedPrice?: number;
    demandLevel?: number;
    competitorPressure?: number;
    stockScarcity?: number;
  };

  risk: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
  };

  timeline: {
    recommendedAction: 'wait' | 'followup' | 'drop';
  };

  system: {
    timestamp: number;
    locale: string;
  };
}

export class CognitiveContextBuilder {
    private context: Partial<CognitiveContext> = {};

    constructor(initialContext?: Partial<CognitiveContext>) {
        if (initialContext) {
            this.context = { ...initialContext };
        }
    }

    withDeal(deal: DealContext): this {
        this.context.deal = deal;
        return this;
    }

    withMemory(trustScore: number, facts: ExtractedFacts): this {
        this.context.memory = { trustScore, extractedFacts: facts };
        return this;
    }

    withEmotion(energy: EnergyLevel): this {
        this.context.emotion = { energy };
        return this;
    }

    withMarket(marketData: CognitiveContext['market']): this {
        this.context.market = marketData;
        return this;
    }

    withRisk(score: number, level: CognitiveContext['risk']['level'], reasons: string[]): this {
        this.context.risk = { score, level, reasons };
        return this;
    }
    
    withTimeline(action: CognitiveContext['timeline']['recommendedAction']): this {
        this.context.timeline = { recommendedAction: action };
        return this;
    }

    withSystem(timestamp: number, locale: string): this {
        this.context.system = { timestamp, locale };
        return this;
    }

    build(): CognitiveContext {
        // Validate required fields
        if (!this.context.deal || !this.context.system) {
            throw new Error('CognitiveContext requires at least Deal and System information');
        }

        return this.context as CognitiveContext;
    }
}
