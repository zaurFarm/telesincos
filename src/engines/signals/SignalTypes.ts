export interface Signal {
  id: string;
  type: string;
  priority: number; // 0-100
  timestamp: number;
  payload: any;
  count: number;
  dealId?: string;
}
