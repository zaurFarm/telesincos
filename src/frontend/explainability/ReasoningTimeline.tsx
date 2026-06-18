import React from 'react';
import { GitCommit, Activity, Shield, TrendingDown } from 'lucide-react';

interface TraceEvent {
    id: string;
    time: string;
    description: string;
    icon: any;
    color: string;
}

const mockTrace: TraceEvent[] = [
    { id: '1', time: '14:02:11', description: 'Intent spike detected (0.44 → 0.71)', icon: Activity, color: 'emerald' },
    { id: '2', time: '14:03:45', description: 'Market pressure signal received', icon: TrendingDown, color: 'blue' },
    { id: '3', time: '14:04:12', description: 'Pricing engine margin re-evaluation', icon: Activity, color: 'amber' },
    { id: '4', time: '14:05:01', description: 'State transition: CONSIDERATION → NEGOTIATION', icon: GitCommit, color: 'indigo' },
];

export const ReasoningTimeline = () => {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                <Shield size={14} /> Decision Audit Trail
            </h3>

            <div className="relative border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-6">
                {mockTrace.map(event => {
                    const Icon = event.icon;
                    return (
                        <div key={event.id} className="relative pl-6">
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-${event.color}-100 dark:bg-${event.color}-900/50 border-2 border-${event.color}-500 flex items-center justify-center`}>
                                <div className={`w-1.5 h-1.5 rounded-full bg-${event.color}-600 dark:bg-${event.color}-400`}></div>
                            </div>
                            <div className="text-[10px] font-mono text-gray-400 mb-1">{event.time}</div>
                            <div className="text-xs text-gray-800 dark:text-gray-200 font-medium">
                                {event.description}
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="text-[10px] uppercase font-bold text-gray-400 mb-2">Final Recommendation</div>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 px-3 py-2 rounded-lg font-mono text-[11px] font-bold border border-indigo-100 dark:border-indigo-800/50">
                    ACTION: TRIGGER_FOLLOWUP [CONF: 0.87]
                </div>
            </div>
        </div>
    );
};
