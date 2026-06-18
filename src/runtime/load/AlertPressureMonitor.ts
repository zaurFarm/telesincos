export class AlertPressureMonitor {
    private recentAlertsCount = 0;
    private readonly MAX_ALERTS_PER_MIN = 20;

    constructor() {
        setInterval(() => this.resetCounter(), 60000);
    }

    private resetCounter() {
        this.recentAlertsCount = 0;
    }

    recordAlert() {
        this.recentAlertsCount++;
    }

    isUnderPressure(): boolean {
        return this.recentAlertsCount > this.MAX_ALERTS_PER_MIN;
    }

    getPressureFactor(): number {
        return Math.min(1.0, this.recentAlertsCount / this.MAX_ALERTS_PER_MIN);
    }
}

export const GlobalAlertPressure = new AlertPressureMonitor();
