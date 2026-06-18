import { GlobalMetrics } from '../../system/observability/MetricsCollector';

export class MetricsPipeline {
    static exportPrometheus(): string {
        const metrics = GlobalMetrics.getMetrics();
        let prometheusData = '';
        
        for (const m of metrics) {
             const tagString = m.tags 
                 ? Object.entries(m.tags).map(([k,v]) => `${k}="${v}"`).join(',') 
                 : '';
             prometheusData += `${m.name}${tagString ? `{${tagString}}` : ''} ${m.value}\n`;
        }
        
        return prometheusData;
    }
}
