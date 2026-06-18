export class DemandEngine {
  static calculateDemand(stock: number, mentionsCount: number, recentVelocity: number): 'high' | 'normal' | 'low' {
    if (stock < 50 && mentionsCount > 100) return 'high';
    if (recentVelocity < 2 && mentionsCount < 10) return 'low';
    return 'normal';
  }
}
