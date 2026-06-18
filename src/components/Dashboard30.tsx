import React, { useState, useEffect } from 'react';
import { Target, AlertTriangle, CheckCircle2, AlertOctagon, TrendingUp, TrendingDown, Clock, Activity, ShieldAlert, ZapIcon } from 'lucide-react';
import { getThemeClasses } from '../theme.js';

export function Dashboard30({ isDarkMode }: { isDarkMode: boolean }) {
  const themeClasses = getThemeClasses(isDarkMode);
  const [sloData, setSloData] = useState<any[]>([]);

  useEffect(() => {
    const fetchSlo = async () => {
      try {
        const res = await fetch('/api/system/slo');
        if (res.ok) setSloData(await res.json());
      } catch (e) {}
    };
    fetchSlo();
    const interval = setInterval(fetchSlo, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (slo: any) => {
    const name = slo.name;
    const val = slo.current_value;
    const target = slo.target_value;
    const critical = slo.critical_threshold;

    if (name === 'ban_rate' || name === 'system_latency') {
        if (val > critical) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (val > target) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    } else {
        if (val < critical) return 'text-red-500 bg-red-500/10 border-red-500/20';
        if (val < target) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
        return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    }
  };

  const getMetricIcon = (sloName: string) => {
    switch (sloName) {
        case 'reply_rate': return <CheckCircle2 className="w-5 h-5" />;
        case 'delivery_rate': return <ZapIcon className="w-5 h-5" />;
        case 'ban_rate': return <ShieldAlert className="w-5 h-5" />;
        case 'system_latency': return <Clock className="w-5 h-5" />;
        default: return <Activity className="w-5 h-5" />;
    }
  };

  const getMetricLabel = (sloName: string) => {
    switch (sloName) {
        case 'reply_rate': return 'Конверсия в ответ (Reply Rate)';
        case 'delivery_rate': return 'Доставляемость (Delivery Rate)';
        case 'ban_rate': return 'Процент банов (Ban Rate)';
        case 'system_latency': return 'Задержка системы (Latency)';
        default: return sloName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
  };

  const formatValue = (sloName: string, val: number) => {
      if (sloName === 'system_latency') return `${val.toFixed(0)} ms`;
      return `${(val * 100).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <Target className="w-8 h-8 text-indigo-500" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Надежность системы (SLO Dashboard)</h2>
          <p className={`${themeClasses.textMuted} text-sm`}>Аналитика в реальном времени и бюджеты ошибок</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sloData.map(slo => {
            const statusClass = getStatusColor(slo);
            
            return (
                <div key={slo.name} className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-xl p-6 shadow-sm`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-2 rounded-lg ${statusClass.split(' ').slice(1).join(' ')}`}>
                            {getMetricIcon(slo.name)}
                        </div>
                        <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${statusClass}`}>
                           {slo.name === 'ban_rate' || slo.name === 'system_latency' ? (
                               slo.current_value > slo.critical_threshold ? 'КРИТИЧНО' : (slo.current_value > slo.target_value ? 'ВНИМАНИЕ' : 'В НОРМЕ')
                           ) : (
                               slo.current_value < slo.critical_threshold ? 'КРИТИЧНО' : (slo.current_value < slo.target_value ? 'ВНИМАНИЕ' : 'В НОРМЕ')
                           )}
                        </span>
                    </div>
                    
                    <h3 className={`text-sm font-medium ${themeClasses.textMuted} mb-1`}>{getMetricLabel(slo.name)}</h3>
                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-3xl font-bold">{formatValue(slo.name, slo.current_value)}</span>
                        <span className={`text-sm mb-1 ${themeClasses.textMuted}`}>/ цель {formatValue(slo.name, slo.target_value)}</span>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                        <div className="flex justify-between text-xs mb-1">
                            <span className={themeClasses.textMuted}>Остаток бюджета ошибок</span>
                            <span className="font-medium text-indigo-500">{formatValue(slo.name, slo.budget)}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                            <div 
                                className={`bg-indigo-500 h-1.5 rounded-full`} 
                                style={{ width: `${Math.max(0, Math.min(100, (slo.budget / (1 - slo.target_value)) * 100))}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>
    </div>
  );
}
