export interface Metric {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp: number;
}

export class MetricsCollector {
  private metrics: Metric[] = [];

  record(name: string, value: number, tags?: Record<string, string>) {
    this.metrics.push({
      name,
      value,
      tags,
      timestamp: Date.now(),
    });
    // Truncate for memory safety in dev
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  recordLatency(processName: string, ms: number) {
    this.record('process_latency_ms', ms, { process: processName });
  }

  recordEvent(eventName: string, count: number = 1) {
    this.record('event_count', count, { event: eventName });
  }

  getMetrics(): Metric[] {
    return this.metrics;
  }
}

export const GlobalMetrics = new MetricsCollector();
