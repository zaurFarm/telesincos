import { Signal } from './SignalTypes';

export class SignalDecayModel {
  static calculateDecayedPriority(signal: Signal, now: number): number {
    const ageMs = now - signal.timestamp;
    const halfLifeMs = 10 * 60 * 1000; // 10 minutes
    
    if (ageMs < 0) return signal.priority;

    const decayFactor = Math.pow(0.5, ageMs / halfLifeMs);
    return Math.max(0, signal.priority * decayFactor);
  }
}
