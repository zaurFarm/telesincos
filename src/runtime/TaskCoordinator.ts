import { GlobalExecutionQueue } from './queue/DelayedExecutionQueue';
import { GlobalCapabilityGate, Capability } from '../system/capabilities/CapabilityGate';

export class TaskCoordinator {
  private intervalId: any;

  start() {
    this.intervalId = setInterval(() => this.tick(), 1000);
  }

  stop() {
    clearInterval(this.intervalId);
  }

  private tick() {
    const dueTasks = GlobalExecutionQueue.getDueExecutions();
    
    for (const task of dueTasks) {
       GlobalExecutionQueue.markAsProcessing(task);
       this.execute(task);
    }
  }

  private execute(task: any) {
    console.log(`[Runtime Coordinator] Executing ${task.directive.action} for Deal ${task.dealId}`);
    // Capability Gate check
    try {
        // e.g., if action is direct price manipulation
        if (task.directive.action === 'SET_PRICE_DIRECT') {
            GlobalCapabilityGate.validateOrThrow(Capability.SET_PRICE);
        }
        
        // Final Execution happens here
        task.status = 'done';
    } catch (e: any) {
        console.error(`[Runtime Coordinator] Execution blocked:`, e.message);
        task.status = 'cancelled';
        // Dispatch alert to operator
    }
  }
}

export const GlobalTaskCoordinator = new TaskCoordinator();
