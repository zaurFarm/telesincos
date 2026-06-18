import React, { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Percent, Target, Zap, ShieldCheck, FileKey, History, UserCog, Database, AlertCircle } from 'lucide-react';

export function BusinessAnalyticsDashboard() {
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/billing')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setBilling(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Сэкономлено (ИИ)', value: billing ? `$${(billing.usage?.ai_calls * 0.15).toFixed(0)}` : '$0', sub: 'через ИИ-переговоры', icon: DollarSign, color: 'emerald' },
    { label: 'Выручка под влиянием ИИ', value: billing ? `$${(billing.usage?.ai_calls * 10).toLocaleString()}` : '$0', sub: `${billing?.usage?.ai_calls || 0} сделок обработано`, icon: TrendingUp, color: 'blue' },
    { label: 'Средняя маржа платформы', value: '18.4%', sub: 'Выше мин. порога 15%', icon: Percent, color: 'emerald' },
  ];

  const secondaryKpis = [
    { label: 'Успех переговоров', value: '68.2%', trend: '+4%', up: true },
    { label: 'Конверсия поставщиков', value: '42.5%', trend: '+12%', up: true },
    { label: 'Точность прогнозов', value: '94.8%', trend: 'стабильно', up: null },
    { label: 'Авто-утверждения', value: '89.0%', trend: '-1%', up: false },
  ];

  const policies = [
    { label: 'Изменение промптов и инструкций ИИ', role: 'Только владелец', color: 'purple' },
    { label: 'Лимиты маржи (мин/макс скидка)', role: 'Владелец / Админ', color: 'blue' },
    { label: 'Веса доверия поставщиков', role: 'Закупки / Админ', color: 'emerald' },
    { label: 'Одобрение высокорисковых исключений ИИ', role: 'Уровень менеджера', color: 'orange' },
  ];

  const colorMap: Record<string, string> = {
    purple: 'text-purple-400 bg-purple-500/10',
    blue: 'text-blue-400 bg-blue-500/10',
    emerald: 'text-emerald-400 bg-emerald-500/10',
    orange: 'text-orange-400 bg-orange-500/10',
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="text-gray-200 font-sans h-full">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Заголовок */}
        <div>
          <h1 className="text-3xl font-medium tracking-tight text-white mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            Бизнес KPI и управление ИИ
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            Обзор эффективности ИИ-платформы: финансовый результат, экономия на переговорах, маржинальность и соответствие политикам.
          </p>
        </div>

        {/* Уведомление если нет данных биллинга */}
        {!billing && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            Биллинг не настроен — отображаются демо-значения. Настройте подписку в разделе Биллинг.
          </div>
        )}

        {/* Основные KPI */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {kpis.map((k, i) => (
            <div key={i} className="bg-[#0f0f0f] border border-white/5 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <k.icon className="w-16 h-16" />
              </div>
              <span className="text-gray-400 text-xs font-mono uppercase tracking-wider block mb-4">{k.label}</span>
              <div className="text-3xl font-semibold text-white mb-2">{k.value}</div>
              <div className={`text-xs ${colorMap[k.color]} px-2.5 py-1 rounded-full inline-flex items-center gap-1.5`}>
                <Target className="w-3.5 h-3.5" /> {k.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Вторичные KPI */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {secondaryKpis.map((k, i) => (
            <div key={i} className="bg-[#111] p-5 rounded-lg border border-white/[0.03]">
              <span className="block text-gray-500 text-xs uppercase mb-1">{k.label}</span>
              <span className="text-xl font-medium text-white flex items-baseline gap-2">
                {k.value}
                <span className={`text-[10px] ${k.up === true ? 'text-emerald-500' : k.up === false ? 'text-red-500' : 'text-gray-500'}`}>
                  {k.trend}
                </span>
              </span>
            </div>
          ))}
        </div>

        {/* Политики управления */}
        <h2 className="text-lg font-medium text-white pt-6 border-t border-white/5 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gray-400" />
          Управление ИИ и политики
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm tracking-wide text-gray-400 uppercase font-mono mb-4 flex items-center gap-2">
              <FileKey className="w-4 h-4" /> Конфигурация политик
            </h3>
            <ul className="space-y-3">
              {policies.map((p, i) => (
                <li key={i} className="flex justify-between items-center bg-[#111] p-3 rounded-md border border-white/[0.02]">
                  <span className="text-sm">{p.label}</span>
                  <span className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded ${colorMap[p.color]}`}>
                    <UserCog className="w-3.5 h-3.5" /> {p.role}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6">
            <h3 className="text-sm tracking-wide text-gray-400 uppercase font-mono mb-4 flex items-center gap-2">
              <History className="w-4 h-4" /> Последние изменения политик
            </h3>
            <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-sm">
              <History className="w-8 h-8 mb-2 opacity-30" />
              История изменений появится после первых действий
            </div>
          </div>
        </div>

        {/* Реестр моделей */}
        <h2 className="text-lg font-medium text-white pt-6 border-t border-white/5 flex items-center gap-2">
          <Database className="w-5 h-5 text-gray-400" />
          Реестр моделей и промптов
        </h2>

        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-6">
          <h3 className="text-sm tracking-wide text-gray-400 uppercase font-mono mb-4 flex items-center gap-2">
            <FileKey className="w-4 h-4" /> Активные промпты и модели
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-400">
              <thead className="bg-[#111] text-xs uppercase font-mono text-gray-500">
                <tr>
                  <th className="px-4 py-3 rounded-l-md font-medium">Роль агента</th>
                  <th className="px-4 py-3 font-medium">Версия промпта</th>
                  <th className="px-4 py-3 font-medium">Модель</th>
                  <th className="px-4 py-3 rounded-r-md font-medium">Статус</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { role: 'NegotiatorAgent', ver: 'v1.0', model: 'Gemini', status: 'Активен', color: 'emerald' },
                  { role: 'RiskAgent', ver: 'v1.0', model: 'Gemini', status: 'Активен', color: 'emerald' },
                  { role: 'MarketAgent', ver: 'v1.0', model: 'Gemini', status: 'Активен', color: 'emerald' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4 text-gray-300 font-medium font-mono text-xs">{row.role}</td>
                    <td className="px-4 py-4 text-xs font-mono">{row.ver}</td>
                    <td className="px-4 py-4 text-blue-400 text-xs">{row.model}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs ${colorMap[row.color]} px-2.5 py-1 rounded-full`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current" /> {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
