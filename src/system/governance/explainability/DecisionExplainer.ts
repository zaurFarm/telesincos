export class DecisionExplainer {
  static explain(context: any) {
    return [
      'High purchase intent detected',
      'Risk score below escalation threshold',
      'Client trust score increased',
      'Market demand currently elevated'
    ];
  }
}
