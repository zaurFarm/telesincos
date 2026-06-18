export interface RuntimeHealth {
  queuePressure: number;
  projectionLag: number;
  memoryUsage: number;
  eventLoopLag: number;
  activeAgents: number;
  redisLatency: number;
  llmLatency: number;
  degraded: boolean;
}
