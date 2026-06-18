export interface OperatorLoad {
  operatorId: string;
  activeDealCount: number;
  unresolvedHandoffs: number;
}

export class OperatorLoadBalancer {
  private operatorLoads: Map<string, OperatorLoad> = new Map();

  updateLoad(operatorId: string, load: Partial<OperatorLoad>) {
    const current = this.operatorLoads.get(operatorId) || { operatorId, activeDealCount: 0, unresolvedHandoffs: 0 };
    this.operatorLoads.set(operatorId, { ...current, ...load });
  }

  assignHandoff(): string | null {
    // Find operator with least unresolved handoffs
    const operators = Array.from(this.operatorLoads.values());
    if (operators.length === 0) return null; // Queue fallback

    operators.sort((a, b) => a.unresolvedHandoffs - b.unresolvedHandoffs);
    return operators[0].operatorId;
  }
}

export const GlobalOperatorLoadBalancer = new OperatorLoadBalancer();
