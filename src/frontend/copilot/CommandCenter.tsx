import React, { useEffect, useState } from 'react';
import { AlertOctagon, ShieldAlert, Layers } from 'lucide-react';
import { Signal } from '../../engines/signals/SignalTypes';

export const CommandCenter = () => {
    const [signals, setSignals] = useState<Signal[]>([]);

    useEffect(() => {
        const handleSignals = (e: any) => {
            setSignals(e.detail);
        };
        window.addEventListener('signals:updated', handleSignals);
        return () => window.removeEventListener('signals:updated', handleSignals);
    }, []);

    const criticalSignals = signals.filter(s => s.priority >= 80);

    return (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                <Layers size={14} className="text-blue-500" /> Strategic Command
            </h2>

            {criticalSignals.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                    <ShieldAlert size={24} className="mb-2 opacity-50" />
                    <span className="text-xs font-medium uppercase tracking-widest text-center">All systems nominal<br/>No critical alerts</span>
                </div>
            ) : (
                <div className="space-y-3">
                    {criticalSignals.map(signal => (
                        <div key={signal.id} className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg p-3 flex items-start gap-3">
                            <div className="mt-0.5">
                                <AlertOctagon size={16} className="text-red-500" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-red-700 dark:text-red-400 uppercase">
                                    {signal.type.replace(/_/g, ' ')}
                                </div>
                                <div className="text-[10px] text-red-600 dark:text-red-300 mt-1 uppercase font-bold tracking-widest">
                                    Priority: {Math.round(signal.priority)}/100 {signal.count > 1 ? `| x${signal.count}` : ''}
                                </div>
                                {signal.dealId && (
                                    <div className="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 px-2 py-0.5 rounded font-mono mt-2 inline-block">
                                        DEAL: {signal.dealId}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
