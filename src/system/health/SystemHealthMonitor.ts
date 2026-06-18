export interface SystemHealthMetrics {
    eventThroughput: number;
    queuePressure: number;
    memoryUsageMB: number;
    llmLatencyMs: number;
}

export class SystemHealthMonitor {
    private metrics: SystemHealthMetrics = {
        eventThroughput: 0,
        queuePressure: 0,
        memoryUsageMB: 0,
        llmLatencyMs: 0
    };

    getHealth(): SystemHealthMetrics {
        if (typeof window !== 'undefined' && 'performance' in window && (window.performance as any).memory) {
            this.metrics.memoryUsageMB = Math.round((window.performance as any).memory.usedJSHeapSize / 1024 / 1024);
        }
        return this.metrics;
    }

    updateLatency(ms: number) {
        this.metrics.llmLatencyMs = ms;
    }
    
    updateThroughput(count: number) {
        this.metrics.eventThroughput = count;
    }
}

export const GlobalSystemHealth = new SystemHealthMonitor();
