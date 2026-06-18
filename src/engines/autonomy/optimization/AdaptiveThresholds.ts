export class AdaptiveThresholds {
  private static thresholds = {
    negotiationIntent: 0.7,
    escalationRisk: 80,
    trustMinimum: 40
  };

  static update(metrics: {
    conversionRate: number;
    riskFailures: number;
  }) {
    if (metrics.conversionRate < 0.2) {
      this.thresholds.negotiationIntent -= 0.05;
    }
    if (metrics.riskFailures > 10) {
      this.thresholds.escalationRisk -= 5;
    }
  }

  static get() {
    return this.thresholds;
  }
}
