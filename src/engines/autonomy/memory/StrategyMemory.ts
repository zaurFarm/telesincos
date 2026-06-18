export interface StrategySnapshot {
  strategy: string;
  market: string;
  successRate: number;
  averageMargin: number;
  updatedAt: number;
}

export class StrategyMemory {
  private static memory: StrategySnapshot[] = [];

  static remember(snapshot: StrategySnapshot) {
    this.memory.push(snapshot);
  }

  static getBest(market: string) {
    return this.memory
      .filter(s => s.market === market)
      .sort((a, b) => b.successRate - a.successRate)[0];
  }
}
