export class QueuePressureController {
  static shouldThrottle(queueSize: number) {
    return queueSize > 10000;
  }

  static getPressureLevel(queueSize: number) {
    if (queueSize > 50000) {
      return 'CRITICAL';
    }
    if (queueSize > 10000) {
      return 'HIGH';
    }
    return 'NORMAL';
  }
}
