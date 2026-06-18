import { db } from '../db.js';

// STAGE 23 - Adaptive Publishing Policy & Reputation System

export interface PublishOutcome {
  postId: number;
  views: number;
  reactions: number;
  forwards: number;
  complaints: number;
  spamReports: number;
  shadowRestricted?: boolean;
  strategy: string;
}

export class PublishReputationEngine {
  static async evaluateOutcome(outcome: PublishOutcome) {
    const positiveEngagement = outcome.views * 1 + outcome.reactions * 5 + outcome.forwards * 10;
    const spamPenalty = outcome.spamReports * 50;
    const leakagePenalty = outcome.complaints * 100;
    const shadowPenalty = outcome.shadowRestricted ? 500 : 0;
    
    const finalScore = positiveEngagement - spamPenalty - leakagePenalty - shadowPenalty;

    await db.query(`
      INSERT INTO publish_reputation 
      (post_id, views, reactions, forwards, complaints, spam_reports, shadow_restricted, final_score, strategy)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [outcome.postId, outcome.views, outcome.reactions, outcome.forwards, outcome.complaints, outcome.spamReports, outcome.shadowRestricted || false, finalScore, outcome.strategy]);

    // Update strategy performance
    await StrategyScoreTracker.updateStrategy(outcome.strategy, finalScore);
  }
}

export class StrategyScoreTracker {
  static async updateStrategy(strategyName: string, recentScore: number) {
    const { rows } = await db.query(`SELECT * FROM strategy_reputation WHERE strategy_name = $1`, [strategyName]);
    
    if (rows.length === 0) {
      await db.query(`
        INSERT INTO strategy_reputation (strategy_name, success_rate, weight)
        VALUES ($1, $2, $3)
      `, [strategyName, recentScore > 0 ? 0.5 : 0.1, recentScore > 0 ? 1.1 : 0.9]);
    } else {
      const current = rows[0];
      const newSuccess = (current.success_rate * 0.9) + ((recentScore > 0 ? 1 : 0) * 0.1);
      
      // Decay weight, adapt to recent score
      let newWeight = current.weight;
      if (recentScore > 50) newWeight = Math.min(2.0, newWeight * 1.05);
      if (recentScore < -50) newWeight = Math.max(0.1, newWeight * 0.8);

      await db.query(`
        UPDATE strategy_reputation
        SET success_rate = $1, weight = $2, updated_at = NOW()
        WHERE strategy_name = $3
      `, [newSuccess, newWeight, strategyName]);
    }
  }

  static async getStrategyWeights(): Promise<Record<string, number>> {
    const { rows } = await db.query(`SELECT strategy_name, weight FROM strategy_reputation`);
    const weights: Record<string, number> = {};
    for (const row of rows) {
      weights[row.strategy_name] = row.weight;
    }
    return weights;
  }
}

export class AdaptivePublishingPolicy {
  static async evaluateMarketConditions(): Promise<{ shouldThrottle: boolean, recommendedStrategy: string | null }> {
    const { rows: stats } = await db.query(`
      SELECT AVG(final_score) as avg_score, SUM(spam_reports) as recent_spam
      FROM publish_reputation
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    
    const avgScore = stats[0]?.avg_score || 0;
    const recentSpam = stats[0]?.recent_spam || 0;

    let shouldThrottle = false;
    if (recentSpam > 5 || avgScore < -100) {
      shouldThrottle = true; // Risk of shadow ban / poor performance
    }

    // Select randomly but weighted by strategy_reputation
    const strategies = await StrategyScoreTracker.getStrategyWeights();
    let bestStrategy = null;
    let highestWeight = -1;
    for (const [name, weight] of Object.entries(strategies)) {
       if (weight > highestWeight) {
         highestWeight = weight;
         bestStrategy = name;
       }
    }

    return { shouldThrottle, recommendedStrategy: bestStrategy };
  }
}
