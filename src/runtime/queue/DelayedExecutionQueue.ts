import { CognitiveDirective } from '../PriorityArbiter';

interface QueuedExecution {
  dealId: string;
  directive: CognitiveDirective;
  executeAt: number;
  status: 'pending' | 'processing' | 'done' | 'cancelled';
}

export class DelayedExecutionQueue {
  private queue: QueuedExecution[] = [];

  enqueue(dealId: string, directive: CognitiveDirective, delayMs: number = 0) {
    this.queue.push({
      dealId,
      directive,
      executeAt: Date.now() + delayMs,
      status: 'pending'
    });
  }

  cancel(dealId: string, actionType?: string) {
    this.queue.forEach(item => {
      if (item.dealId === dealId && item.status === 'pending') {
        if (!actionType || item.directive.action === actionType) {
          item.status = 'cancelled';
        }
      }
    });
  }

  getDueExecutions(now: number = Date.now()): QueuedExecution[] {
    return this.queue.filter(
      item => item.status === 'pending' && item.executeAt <= now
    );
  }
  
  markAsProcessing(item: QueuedExecution) {
    item.status = 'processing';
  }
}

export const GlobalExecutionQueue = new DelayedExecutionQueue();
