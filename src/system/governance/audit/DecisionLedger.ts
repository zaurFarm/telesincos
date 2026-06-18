export interface DecisionRecord {
  agent: string;
  action: string;
  confidence: number;
  strategy: string;
  reasoning: string[];
  timestamp: number;
}

export class DecisionLedger {
  static records: DecisionRecord[] = [];

  static record(r: DecisionRecord) {
    this.records.push(r);
  }
}
