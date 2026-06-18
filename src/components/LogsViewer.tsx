import React, { useState, useEffect } from 'react';
import { Terminal, AlertTriangle, AlertCircle, TrendingUp, Search, RefreshCw, Cpu } from 'lucide-react';
import { getThemeClasses } from '../theme.js';

export function LogsViewer({ isDarkMode }: { isDarkMode: boolean }) {
  const themeClasses = getThemeClasses(isDarkMode);
  const [logs, setLogs] = useState<any[]>([]);
  const [filterLevel, setFilterLevel] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (filterLevel) q.append('level', filterLevel);
      if (filterType) q.append('type', filterType);
      if (searchQuery) q.append('query', searchQuery);
      
      const res = await fetch(`/api/system/logs?${q.toString()}`);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const getAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch('/api/system/analyze-logs', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAiAnalysis(data.analysis);
      }
    } catch(e) {}
    setAnalyzing(false);
  };

  useEffect(() => {
    fetchLogs();
    const int = setInterval(fetchLogs, 10000); // auto refresh
    return () => clearInterval(int);
  }, [filterLevel, filterType, searchQuery]);

  const levelColor = (lvl: string) => {
    if (lvl === 'error') return 'text-red-500 bg-red-500/10';
    if (lvl === 'warn') return 'text-yellow-500 bg-yellow-500/10';
    return 'text-blue-500 bg-blue-500/10';
  }

  return (
    <div className={`space-y-6`}>
      <div className={`p-6 rounded-xl border ${themeClasses.cardBorder} ${themeClasses.cardBg} shadow-sm`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Terminal className="w-6 h-6 text-indigo-500" />
            Observability & Logs
          </h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 bg-transparent border ${themeClasses.cardBorder} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20`}
              />
            </div>
            <select className={`px-3 py-2 bg-transparent border ${themeClasses.cardBorder} rounded-lg text-sm`} value={filterLevel} onChange={e => setFilterLevel(e.target.value)}>
              <option value="">All Levels</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
            <select className={`px-3 py-2 bg-transparent border ${themeClasses.cardBorder} rounded-lg text-sm`} value={filterType} onChange={e => setFilterType(e.target.value)}>
              <option value="">All Types</option>
              <option value="system">System</option>
              <option value="worker">Worker</option>
              <option value="lead">Lead</option>
              <option value="ban">Ban</option>
            </select>
            <button onClick={fetchLogs} className={`p-2 rounded-lg border ${themeClasses.cardBorder} hover:bg-black/5 dark:hover:bg-white/5`}>
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={getAnalysis} disabled={analyzing} className={`px-4 py-2 bg-indigo-500 text-white rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-indigo-600 disabled:opacity-50`}>
              <Cpu className={`w-4 h-4 ${analyzing ? 'animate-pulse' : ''}`} />
              {analyzing ? 'Analyzing...' : 'AI Diagnose'}
            </button>
          </div>
        </div>

        {aiAnalysis && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
            <h3 className="font-semibold text-indigo-500 flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4" />
              AI SRE Analysis (DeepSeek)
            </h3>
            <div className="text-sm whitespace-pre-wrap">{aiAnalysis}</div>
          </div>
        )}

        <div className={`overflow-x-auto rounded-lg border ${themeClasses.cardBorder}`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/10 dark:border-white/10 uppercase text-xs font-semibold text-gray-500">
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Context</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-mono">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleTimeString([], { hour12: false })}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider ${levelColor(log.level)}`}>
                      {log.level}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{log.type}</td>
                  <td className="px-4 py-3 max-w-md truncate" title={log.message}>{log.message}</td>
                  <td className="px-4 py-3 text-xs text-gray-400 truncate max-w-xs" title={JSON.stringify(log.metadata || {})}>
                    {log.account_id && <span className="mr-2 text-indigo-400">Acc#{log.account_id}</span>}
                    {(JSON.stringify(log.metadata) || '').substring(0, 50)}{JSON.stringify(log.metadata)?.length > 50 ? '...' : ''}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No logs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
