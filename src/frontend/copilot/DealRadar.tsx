import React from 'react';
import { Target, Activity, DollarSign, Brain } from 'lucide-react';
import { CognitiveContext } from '../../engines/context/CognitiveContextBuilder';

interface Props {
    context?: CognitiveContext;
}

export const DealRadar = ({ context }: Props) => {
    if (!context) {
        return <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 animate-pulse h-48"></div>;
    }

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h2 className="text-sm font-bold flex items-center gap-2 mb-4 text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                <Target size={14} className="text-emerald-500" /> Deal Radar
            </h2>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1.5"><Activity size={10} /> Intent Score</div>
                    <div className="text-xl font-mono font-bold text-gray-900 dark:text-white">
                        {Math.round(context.deal.intentScore * 100)}%
                    </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1.5"><Brain size={10} /> State</div>
                    <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                        {context.deal.state}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-800 col-span-2 flex justify-between items-center">
                    <div>
                        <div className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex items-center gap-1.5"><DollarSign size={10} /> Deal Value</div>
                        <div className="text-lg font-mono font-bold text-gray-900 dark:text-white">
                            ${context.deal.proposedPrice || '---'}
                        </div>
                    </div>
                    {context.timeline.recommendedAction === 'drop' ? (
                       <div className="px-2 py-1 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[10px] uppercase font-bold rounded">DROP</div>
                    ) : context.timeline.recommendedAction === 'followup' ? (
                       <div className="px-2 py-1 bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[10px] uppercase font-bold rounded">FOLLOW-UP</div>
                    ) : (
                       <div className="px-2 py-1 bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-[10px] uppercase font-bold rounded">WAIT</div>
                    )}
                </div>
            </div>
        </div>
    );
};
