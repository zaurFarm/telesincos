export interface CognitiveDirective {
  id: string;
  source: 'MARKET' | 'RISK' | 'TIMELINE' | 'NEGOTIATION' | 'OPERATOR';
  priority: number; // 0-100
  ttl: number; // Time to live in ms
  action: string;
  confidence: number;
  payload?: any;
}

export class PriorityArbiter {
  static resolveConflict(directives: CognitiveDirective[]): CognitiveDirective | null {
    if (directives.length === 0) return null;

    // 1. HARD RULE: Operator directives always bypass arbitration if priority > 80
    const operatorOverrides = directives.filter(d => d.source === 'OPERATOR' && d.priority > 80);
    if (operatorOverrides.length > 0) {
      return operatorOverrides.sort((a, b) => b.priority - a.priority)[0];
    }

    // 2. HARD RULE: Risk directives (e.g., Block, Handoff) > 90 always win against non-operator
    const criticalRisks = directives.filter(d => d.source === 'RISK' && d.priority >= 90);
    if (criticalRisks.length > 0) {
      return criticalRisks.sort((a, b) => b.priority - a.priority)[0];
    }

    // 3. General arbitration: highest priority wins
    return directives.reduce((prev, current) => 
      (prev.priority > current.priority) ? prev : current
    );
  }
}
