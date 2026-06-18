import { RuntimeTelemetryBus } from './RuntimeTelemetryBus.js';

export interface MTProtoEventPayload {
  rpcMethod?: string;
  latencyMs?: number;
  floodWaitSeconds?: number;
  errorMessage?: string;
  peerId?: string;
  [key: string]: any;
}

export class MTProtoTelemetryAdapter {
  static trackRpcLatency(method: string, latencyMs: number) {
    RuntimeTelemetryBus.emit({
      id: `mtproto_rpc_latency_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'MTPROTO_RPC_LATENCY',
      timestamp: Date.now(),
      source: 'mtproto_runtime',
      payload: {
        rpcMethod: method,
        latencyMs
      }
    });

    // Also update trust reality model
    FloodWaitRealityModel.recordSendLatency(latencyMs);
  }

  static trackFloodWait(method: string, seconds: number) {
    RuntimeTelemetryBus.emit({
      id: `mtproto_floodwait_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'MTPROTO_FLOODWAIT',
      timestamp: Date.now(),
      source: 'mtproto_runtime',
      payload: {
        rpcMethod: method,
        floodWaitSeconds: seconds
      }
    });

    FloodWaitRealityModel.recordFloodWait(seconds);
  }

  static trackRpcError(method: string, errorMsg: string, peerId?: string) {
    RuntimeTelemetryBus.emit({
      id: `mtproto_rpc_error_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      type: 'MTPROTO_RPC_ERROR',
      timestamp: Date.now(),
      source: 'mtproto_runtime',
      payload: {
        rpcMethod: method,
        errorMessage: errorMsg,
        peerId
      }
    });

    FloodWaitRealityModel.recordFailure();
  }

  static trackSuccess(peerId?: string) {
    FloodWaitRealityModel.recordSuccess();
  }
}

class FloodWaitReality {
  private recentLatencies: number[] = [];
  private totalSends = 0;
  private totalFailures = 0;
  private totalFloodWaits = 0;
  private lastFloodWaitAt = 0;

  recordSendLatency(latency: number) {
    this.recentLatencies.push(latency);
    if (this.recentLatencies.length > 100) this.recentLatencies.shift();
  }

  recordFloodWait(seconds: number) {
    this.totalFloodWaits++;
    this.lastFloodWaitAt = Date.now();
  }

  recordFailure() {
    this.totalFailures++;
    this.totalSends++;
  }

  recordSuccess() {
    this.totalSends++;
  }

  getTrustScore(): number {
    let score = 100;
    
    // Penalize for flood waits (decay over time)
    if (this.lastFloodWaitAt > 0) {
      const hoursSinceFW = (Date.now() - this.lastFloodWaitAt) / (1000 * 60 * 60);
      if (hoursSinceFW < 24) {
        score -= (24 - hoursSinceFW) * 2; // up to -48
      }
    }

    // Penalize for failures
    if (this.totalSends > 0) {
      const failRate = this.totalFailures / this.totalSends;
      score -= Math.floor(failRate * 50);
    }

    // Penalize for high latency
    if (this.recentLatencies.length > 0) {
      const avgLatency = this.recentLatencies.reduce((a, b) => a + b, 0) / this.recentLatencies.length;
      if (avgLatency > 2000) score -= 10;
      else if (avgLatency > 5000) score -= 20;
    }

    return Math.max(0, Math.min(100, score));
  }
  
  getMetrics() {
    return {
      trustScore: this.getTrustScore(),
      totalSends: this.totalSends,
      totalFailures: this.totalFailures,
      totalFloodWaits: this.totalFloodWaits,
      avgLatency: this.recentLatencies.length ? 
        Math.floor(this.recentLatencies.reduce((a, b) => a + b, 0) / this.recentLatencies.length) : 0
    };
  }
}

export const FloodWaitRealityModel = new FloodWaitReality();
