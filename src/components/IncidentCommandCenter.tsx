import React, { useState, useEffect } from 'react';
import { AlertOctagon, CheckCircle2, XCircle, ShieldAlert, Zap, TrendingDown, RefreshCw } from 'lucide-react';
import { getThemeClasses } from '../theme.js';

export function IncidentCommandCenter({ isDarkMode }: { isDarkMode: boolean }) {
  const themeClasses = getThemeClasses(isDarkMode);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/incidents');
      if (res.ok) setIncidents(await res.json());
    } catch(e) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchIncidents();
    const int = setInterval(fetchIncidents, 10000);
    return () => clearInterval(int);
  }, []);

  const handleApprove = async (incidentId: number, actionId: number) => {
    try {
      await fetch(`/api/system/incidents/${incidentId}/action/${actionId}/approve`, { method: 'POST' });
      fetchIncidents();
    } catch(e) {}
  };

  const handleReject = async (incidentId: number, actionId: number) => {
    try {
      await fetch(`/api/system/incidents/${incidentId}/action/${actionId}/reject`, { method: 'POST' });
      fetchIncidents();
    } catch(e) {}
  };

  const simulateIncident = async () => {
    try {
      await fetch('/api/system/test-incident', { method: 'POST' });
      fetchIncidents();
    } catch(e) {}
  };

  return (
    <div className={`space-y-6`}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <AlertOctagon className="w-6 h-6 text-red-500" />
            Центр управления инцидентами
          </h2>
          <p className={`text-sm ${themeClasses.textMuted} mt-1`}>AI-аналитика аномалий и процесс утверждения патчей</p>
        </div>
        <button onClick={simulateIncident} className="px-4 py-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors border border-red-500/20">
          Сгенерировать инцидент
        </button>
      </div>

      <div className="grid gap-6">
        {incidents.map(incident => (
          <div key={incident.id} className={`rounded-xl border ${incident.status === 'ACTIVE' ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : themeClasses.cardBorder} ${themeClasses.cardBg} overflow-hidden`}>
            
            {/* Header */}
            <div className={`px-6 py-4 border-b ${themeClasses.cardBorder} bg-gradient-to-r ${incident.status === 'ACTIVE' ? 'from-red-500/10 to-transparent' : 'from-gray-500/5 to-transparent'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${
                    incident.status === 'ACTIVE' ? 'bg-red-500 text-white' : 'bg-green-500/10 text-green-500'
                  }`}>
                    {incident.status}
                  </span>
                  <span className={`text-xs font-mono ${themeClasses.textMuted}`}>INC-${incident.id}</span>
                  <span className={`text-xs ${themeClasses.textMuted}`}>{new Date(incident.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium">
                  <span className="flex items-center gap-1.5 text-orange-500">
                    <TrendingDown className="w-4 h-4" />
                    Влияние на SLO: {incident.slo_impact}%
                  </span>
                  <span className={`flex items-center gap-1.5 ${themeClasses.text}`}>
                    Уверенность ИИ: {(incident.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-semibold mt-1">{incident.root_cause}</h3>
            </div>

            {/* AI Suggestions / Actions */}
            <div className="p-6">
              <h4 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2 text-indigo-500">
                <Zap className="w-4 h-4" />
                ПРЕДЛОЖЕНИЯ АВТОМАТИЗАЦИИ (AI)
              </h4>
              
              <div className="space-y-4">
                {incident.actions?.map((action: any) => (
                  <div key={action.id} className={`p-4 rounded-lg border ${themeClasses.cardBorder} flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    action.status === 'executed' ? 'bg-green-500/5 border-green-500/30' :
                    action.status === 'rejected' ? 'bg-gray-500/5 opacity-50' :
                    'bg-slate-50 dark:bg-[#151515]'
                  }`}>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded uppercase ${
                          action.risk_level === 'high' ? 'bg-red-500/10 text-red-500' :
                          action.risk_level === 'medium' ? 'bg-orange-500/10 text-orange-500' :
                          'bg-blue-500/10 text-blue-500'
                        }`}>
                          Риск: {action.risk_level}
                        </span>
                        <span className="font-mono text-sm font-semibold">{action.action_type}</span>
                        {action.confidence > 0.9 && (
                          <span className="text-xs text-green-500 font-medium bg-green-500/10 px-2 py-0.5 rounded">Высокая уверенность</span>
                        )}
                      </div>
                      <p className={`text-sm ${themeClasses.textMuted}`}>{action.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {action.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleReject(incident.id, action.id)}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Отклонить"
                          >
                            <XCircle className="w-6 h-6" />
                          </button>
                          <button 
                            onClick={() => handleApprove(incident.id, action.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium text-sm"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Одобрить
                          </button>
                        </>
                      )}
                      {action.status === 'executed' && (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-green-500">
                          <CheckCircle2 className="w-4 h-4" />
                          Исполнено ({action.approved_by})
                        </span>
                      )}
                      {action.status === 'rejected' && (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-400">
                          <XCircle className="w-4 h-4" />
                          Отклонено
                        </span>
                      )}
                      {action.status === 'approved' && (
                        <span className="flex items-center gap-1.5 text-sm font-medium text-blue-500">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Применяется...
                        </span>
                      )}
                    </div>

                  </div>
                ))}
                {(!incident.actions || incident.actions.length === 0) && (
                  <p className={`text-sm ${themeClasses.textMuted}`}>Нет предложенных действий.</p>
                )}
              </div>
            </div>

          </div>
        ))}
        {incidents.length === 0 && (
          <div className={`p-12 text-center border border-dashed rounded-xl ${themeClasses.cardBorder} ${themeClasses.textMuted}`}>
            <ShieldAlert className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-1">Нет активных инцидентов</h3>
            <p className="text-sm">Целевые показатели (SLO) находятся в пределах нормы.</p>
          </div>
        )}
      </div>
    </div>
  );
}
