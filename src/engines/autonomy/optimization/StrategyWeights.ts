export class StrategyWeights {
   static weights: Record<string, number> = {
       'trust_based': 1.0,
       'aggressive_discount': 1.0
   };
   
   static increase(strategy: string) {
       this.weights[strategy] = (this.weights[strategy] || 1.0) + 0.1;
   }
   
   static decrease(strategy: string) {
       this.weights[strategy] = Math.max(0.1, (this.weights[strategy] || 1.0) - 0.1);
   }
}
