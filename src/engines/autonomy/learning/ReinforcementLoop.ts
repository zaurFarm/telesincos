import { StrategyWeights } from '../optimization/StrategyWeights.js';

export class ReinforcementLoop {
  static process(outcomeScore: number) {
    if (outcomeScore > 80) {
      StrategyWeights.increase('trust_based');
    } else if (outcomeScore < 20) {
      StrategyWeights.decrease('aggressive_discount');
    }
  }
}
