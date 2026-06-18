import { CognitiveDirective, PriorityArbiter } from './PriorityArbiter';
import { GlobalExecutionQueue } from './queue/DelayedExecutionQueue';

export class ExecutionScheduler {
  private pendingDirectives: Map<string, CognitiveDirective[]> = new Map();
  private batchWindowMs = 500; // Half a second batching window

  submit(dealId: string, directive: CognitiveDirective) {
    if (!this.pendingDirectives.has(dealId)) {
      this.pendingDirectives.set(dealId, []);
      // Schedule an evaluation tick for this deal
      setTimeout(() => this.evaluate(dealId), this.batchWindowMs);
    }
    
    this.pendingDirectives.get(dealId)!.push(directive);
  }

  private evaluate(dealId: string) {
    const directives = this.pendingDirectives.get(dealId) || [];
    if (directives.length === 0) return;

    const winningDirective = PriorityArbiter.resolveConflict(directives);
    
    if (winningDirective) {
      console.log(`[Scheduler] Arbitrated action for deal ${dealId}: ${winningDirective.action} via ${winningDirective.source}`);
      GlobalExecutionQueue.enqueue(dealId, winningDirective);
    }
    
    // Clear evaluated directives
    this.pendingDirectives.delete(dealId);
  }
}

export const GlobalScheduler = new ExecutionScheduler();
