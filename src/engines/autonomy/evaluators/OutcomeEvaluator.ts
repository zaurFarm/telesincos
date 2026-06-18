export interface DealOutcome {
  won: boolean;
  margin: number;
  trustDelta: number;
  durationMs: number;
  discountUsed: number;
  handoffTriggered: boolean;
}

export class OutcomeEvaluator {
  static evaluate(outcome: DealOutcome) {
    let score = 0;
    if (outcome.won) score += 50;
    score += outcome.margin * 0.2;
    score += outcome.trustDelta * 2;
    score -= outcome.discountUsed;
    if (outcome.handoffTriggered) {
      score -= 15;
    }
    return {
      score,
      efficiency: score / Math.max(outcome.durationMs, 1)
    };
  }
}
