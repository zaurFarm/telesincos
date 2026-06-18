import { GlobalAlertPressure } from './AlertPressureMonitor';

export class AttentionAllocator {
  static shouldSuppressAlert(priority: number): boolean {
    // If under high pressure, suppress low priority items
    if (GlobalAlertPressure.isUnderPressure()) {
       // Suppress anything below 60 priority during high load
       return priority < 60;
    }
    
    // Suppress noise completely
    return priority < 20;
  }
}
