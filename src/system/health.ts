export type HealthStatus = 'healthy' | 'degraded' | 'critical';

export class SystemHealth {
  private state: HealthStatus = 'healthy';

  set(status: HealthStatus) {
    this.state = status;
    console.log('[HEALTH] Switched to:', status);
  }

  get() {
    return this.state;
  }

  isCritical() {
    return this.state === 'critical';
  }
}
