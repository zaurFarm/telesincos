import React from 'react';
import { Zap } from 'lucide-react';

interface Props {
  suggestedAction: string;
  confidence: number;
  onExecute: () => void;
  onDismiss: () => void;
}

export const OperatorDecisionBar = ({ suggestedAction, confidence, onExecute, onDismiss }: Props) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-black text-white px-4 py-3 rounded-full flex items-center gap-4 shadow-2xl border border-gray-700 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
       <Zap size={16} className="text-amber-400" />
       
       <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">AI Suggestion</span>
          <span className="text-sm font-semibold">{suggestedAction}</span>
       </div>
       
       <div className="h-8 w-px bg-gray-700 mx-2"></div>
       
       <div className="flex gap-2">
           <button 
             onClick={onDismiss}
             className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-gray-400 hover:bg-gray-800 transition-colors"
           >
              Ignore
           </button>
           <button 
             onClick={onExecute}
             className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-2"
           >
              Execute <span className="bg-black/10 px-1.5 py-0.5 rounded text-[9px]">{confidence}%</span>
           </button>
       </div>
    </div>
  );
};
