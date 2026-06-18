import { GlobalExecutionQueue } from './DelayedExecutionQueue';
import { CognitiveDirective } from '../PriorityArbiter';

export class FollowupScheduler {
  static planFollowup(dealId: string, context: any) {
    if (context.timeline?.recommendedAction === 'drop') {
       return;
    }

    const waitMs = 2 * 60 * 60 * 1000; // 2 hours
    const directive: CognitiveDirective = {
      id: crypto.randomUUID(),
      source: 'TIMELINE',
      priority: 50,
      ttl: waitMs * 2,
      action: 'SEND_FOLLOWUP',
      confidence: 0.8
    };

    GlobalExecutionQueue.enqueue(dealId, directive, waitMs);
  }

  static cancelFollowups(dealId: string) {
    GlobalExecutionQueue.cancel(dealId, 'SEND_FOLLOWUP');
  }
}
