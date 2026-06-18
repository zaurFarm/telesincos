import React from 'react';
import { PlayCircle, PauseCircle, ShieldOff, FastForward } from 'lucide-react';

interface Props {
    dealId: string;
    onOverride: () => void;
    onHandoff: () => void;
}

export const ActionPanel = ({ dealId, onOverride, onHandoff }: Props) => {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3">Operator Actions</h3>
            
            <div className="grid grid-cols-2 gap-2">
                 <button 
                    onClick={onOverride}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group"
                 >
                    <FastForward size={18} className="mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase font-bold">Manual Override</span>
                 </button>

                 <button 
                    onClick={onHandoff}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors group"
                 >
                    <ShieldOff size={18} className="mb-1 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] uppercase font-bold">Force Handoff</span>
                 </button>
            </div>
        </div>
    );
};
