import React, { useState, useEffect } from "react";
import { ShieldAlert, Zap, Bot, ArrowRight, Database, Target, TrendingUp, AlertTriangle, CheckCircle2, HardDrive, RefreshCw } from "lucide-react";

export function AIDecisionCenter() {
  const [filterMode, setFilterMode] = useState("all");
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billing, setBilling] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/incidents").then(r => r.ok ? r.json() : []).catch(() => []),
      fetch("/api/billing").then(r => r.ok ? r.json() : null).catch(() => null),
    ]).then(([incidents, bill]) => {
      setLogs(Array.isArray(incidents) ? incidents : []);
      setBilling(bill);
      setLoading(false);
    });
  }, []);

  const filteredLogs = logs.filter(log => {
    if (filterMode === "high_risk") return log.type === "ban" || log.type === "alert_critical";
    if (filterMode === "escalated") return log.type === "human_escalation";
    return true;
  });

  return (
    <div className="text-gray-200 font-sans h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <h1 className="text-3xl font-medium tracking-tight text-white mb-2 flex items-center gap-3">
              <Bot className="w-8 h-8 text-blue-500" />
              Центр решений ИИ
            </h1>
            <p className="text-gray-400 max-w-2xl text-sm leading-relaxed">
              Прозрачные операции ИИ. Отслеживайте каждое решение системы, источники данных и расчёт рисков.
            </p>
          </div>
          <div className="flex bg-[#111] p-1 rounded-lg border border-white/10 shrink-0">
            {[
              { key: "all", label: "Все действия" },
              { key: "high_risk", label: "Высокий риск" },
              { key: "escalated", label: "Ожидают одобрения" },
            ].map(f => (
              <button key={f.key} onClick={() => setFilterMode(f.key)}
                className={`px-4 py-2 text-xs font-medium rounded-md transition-colors ${filterMode === f.key ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 border-l-2 border-l-blue-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-400 text-xs font-mono uppercase">Средняя маржа</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-semibold text-white mb-1">—</div>
            <div className="text-xs text-gray-500">Данные появятся после первых сделок</div>
          </div>
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 border-l-2 border-l-purple-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-400 text-xs font-mono uppercase">Прогноз спроса (7д)</span>
              <Target className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-semibold text-white mb-1">—</div>
            <div className="text-xs text-gray-500">Недостаточно данных</div>
          </div>
          <div className="bg-[#0f0f0f] border border-white/5 rounded-xl p-5 border-l-2 border-l-orange-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-gray-400 text-xs font-mono uppercase">Использование LLM</span>
              <Zap className="w-4 h-4 text-orange-500" />
            </div>
            <div className="text-2xl font-semibold text-white mb-1">
              {billing ? `${billing.usage?.ai_calls || 0} / ${billing.limits?.ai_calls_limit || 10000}` : "—"}
            </div>
            <div className="text-xs text-gray-500">AI вызовов использовано</div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-gray-500 uppercase flex items-center gap-2">
            <HardDrive className="w-4 h-4" /> Журнал аудита и решений
          </h2>
          {loading && <div className="flex items-center justify-center h-32"><RefreshCw className="w-6 h-6 text-gray-500 animate-spin" /></div>}
          {!loading && filteredLogs.length === 0 && (
            <div className="bg-[#111] border border-white/5 rounded-xl p-12 text-center">
              <Bot className="w-12 h-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Решений пока нет</p>
              <p className="text-gray-600 text-xs mt-1">Журнал заполнится после первых операций ИИ-агентов</p>
            </div>
          )}
          {!loading && filteredLogs.map((log, i) => (
            <div key={log.id || i} className="bg-[#111] border border-white/5 p-6 rounded-xl flex flex-col md:flex-row gap-6 relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${log.type === "ban" || log.type === "alert_critical" ? "bg-red-500" : log.type === "warning" ? "bg-orange-500" : "bg-emerald-500"}`} />
              <div className="flex flex-col justify-between shrink-0 md:w-1/4">
                <div>
                  <span className="text-xs font-mono text-gray-500 block mb-1">{log.id || `INC-${i}`}</span>
                  <strong className="text-base text-gray-200 block leading-snug">{log.message || log.type || "Событие"}</strong>
                  <span className="text-[10px] text-gray-600">{log.timestamp ? new Date(log.timestamp).toLocaleString("ru-RU") : ""}</span>
                </div>
                <div className="mt-4">
                  {(log.type === "ban" || log.type === "alert_critical") && <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full"><AlertTriangle className="w-3.5 h-3.5"/> Критическое</span>}
                  {log.type === "human_escalation" && <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 bg-blue-400/10 px-2.5 py-1 rounded-full"><ShieldAlert className="w-3.5 h-3.5"/> Требует одобрения</span>}
                  {!["ban","alert_critical","human_escalation"].includes(log.type) && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3.5 h-3.5"/> Выполнено</span>}
                </div>
              </div>
              <div className="flex-1">
                <div className="bg-black/30 p-3 rounded-lg border border-white/[0.03]">
                  <span className="text-xs text-gray-500 uppercase tracking-wider block mb-1">Описание</span>
                  <p className="text-sm text-gray-300 leading-relaxed">{log.message || "—"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
