import React from 'react';
import { X, Check } from 'lucide-react';

interface Props {
    title: string;
    details: string;
    onApprove: () => void;
    onReject: () => void;
    isOpen: boolean;
}

export const ApprovalDrawer = ({ title, details, onApprove, onReject, isOpen }: Props) => {
    if (!isOpen) return null;

    return (
        <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom-5 p-4 z-50 rounded-t-2xl">
            <div className="flex items-center justify-between mb-4">
                <div>
                   <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{title}</h4>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{details}</p>
                </div>
                <div className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
                    Approval Req
                </div>
            </div>
            
            <div className="flex gap-3">
                <button 
                   onClick={onReject}
                   className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-xs uppercase font-bold"
                >
                    <X size={14} /> Reject
                </button>
                <button 
                   onClick={onApprove}
                   className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-xs uppercase font-bold"
                >
                    <Check size={14} /> Approve Policy
                </button>
            </div>
        </div>
    );
};
