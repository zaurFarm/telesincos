import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { FeedItem, FeedComposer } from './FeedComposer';
import { FeedGroupingEngine, FeedGroup } from './FeedGroupingEngine';

export const PriorityFeed = () => {
    const [groups, setGroups] = useState<FeedGroup[]>([]);

    useEffect(() => {
        const handleSignals = (e: any) => {
            const rawSignals = e.detail || [];
            const feedItems = rawSignals
               .map(FeedComposer.composeFromSignal)
               .filter(Boolean) as FeedItem[];
               
            setGroups(FeedGroupingEngine.groupItems(feedItems));
        };
        window.addEventListener('signals:updated', handleSignals);
        return () => window.removeEventListener('signals:updated', handleSignals);
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return <ShieldAlert size={16} className="text-red-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-amber-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col h-full max-h-[600px] shadow-sm">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wide">Cognitive Feed</h2>
                <div className="ml-auto bg-gray-100 dark:bg-gray-800 text-[10px] uppercase px-2 py-0.5 rounded-full font-bold text-gray-500">Live</div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {groups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 opacity-50">
                        <Activity size={24} className="mb-2" />
                        <span className="text-[10px] uppercase tracking-widest font-bold">Awaiting Signals</span>
                    </div>
                ) : groups.map(group => (
                    <div key={group.id} className="p-3 bg-gray-50 dark:bg-gray-800/40 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2 mb-2">
                            {getIcon(group.type)}
                            <span className="text-xs font-bold text-gray-900 dark:text-gray-200">{group.title}</span>
                            <span className="ml-auto text-[10px] font-mono text-gray-400">
                                {new Date(group.latestTimestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        <div className="space-y-1.5 pl-6 border-l-2 border-gray-200 dark:border-gray-700 ml-2 mt-1">
                            {group.items.map(item => (
                                <div key={item.id} className="text-[11px] text-gray-600 dark:text-gray-400">
                                   <span className="font-semibold text-gray-800 dark:text-gray-300 block">{item.title}</span>
                                   {item.description}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
