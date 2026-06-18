import { Signal } from './SignalTypes';

export class SignalDeduplicator {
  private static DEDUP_WINDOW_MS = 60 * 1000; // 1 minute

  static deduplicate(signals: Signal[], newSignal: Signal): Signal[] {
    const recentSimilarIndex = signals.findIndex(s => 
      s.type === newSignal.type &&
      s.dealId === newSignal.dealId &&
      (newSignal.timestamp - s.timestamp) < this.DEDUP_WINDOW_MS
    );

    if (recentSimilarIndex !== -1) {
      const existing = signals[recentSimilarIndex];
      const updatedSignals = [...signals];
      
      updatedSignals[recentSimilarIndex] = {
        ...existing,
        count: existing.count + 1,
        priority: Math.min(100, existing.priority + (newSignal.priority * 0.2)),
        timestamp: newSignal.timestamp // refresh timestamp
      };
      return updatedSignals;
    }

    return [...signals, newSignal];
  }
}
