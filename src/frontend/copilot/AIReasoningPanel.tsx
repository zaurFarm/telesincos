import React from 'react';
import { Bot, CheckCircle2 } from 'lucide-react';

interface ReasoningProps {
    decision: string;
    reasoning: string[];
    confidence: number;
    alternativesRejected?: string[];
}

export const AIReasoningPanel = ({ decision, reasoning, confidence, alternativesRejected }: ReasoningProps) => {
    return (
        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800/30 relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-[20px] -mr-10 -mt-10 pointer-events-none"></div>
            
            <h2 className="text-sm font-bold flex items-center gap-2 mb-4 text-indigo-900 dark:text-indigo-300 uppercase tracking-wider relative z-10">
                <Bot size={14} /> AI Reasoning
            </h2>

            <div className="space-y-4 relative z-10">
                <div>
                   <div className="text-[10px] uppercase text-indigo-400 dark:text-indigo-500 font-bold tracking-widest mb-1.5">Top Decision</div>
                   <div className="px-3 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded font-mono text-xs border border-indigo-200 dark:border-indigo-800/50 shadow-sm flex justify-between items-center">
                       {decision}
                       <span className="text-[10px] bg-white/60 dark:bg-black/30 px-1.5 py-0.5 rounded font-bold">{(confidence * 100).toFixed(0)}% CONF</span>
                   </div>
                </div>

                <div>
                   <div className="text-[10px] uppercase text-indigo-400 dark:text-indigo-500 font-bold tracking-widest mb-2">Based on Context</div>
                   <ul className="space-y-2">
                       {reasoning.map((reason, idx) => (
                           <li key={idx} className="flex items-start gap-2 text-xs text-indigo-900/70 dark:text-indigo-300/80 leading-relaxed">
                               <CheckCircle2 size={12} className="text-indigo-400 dark:text-indigo-600 shrink-0 mt-0.5" />
                               <span>{reason}</span>
                           </li>
                       ))}
                   </ul>
                </div>

                {alternativesRejected && alternativesRejected.length > 0 && (
                    <div>
                       <div className="text-[10px] uppercase text-gray-400 dark:text-gray-500 font-bold tracking-widest mb-1">Rejected Paths</div>
                       <ul className="space-y-1">
                           {alternativesRejected.map((alt, idx) => (
                               <li key={idx} className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 line-through opacity-70">
                                   - {alt}
                               </li>
                           ))}
                       </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
