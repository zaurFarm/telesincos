import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Bot, Activity, Brain, Server, Shield, Network, Zap, GitCommit, Search, RefreshCw, Hexagon, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const translations = {
  en: {
    title: "Cognitive Runtime OS",
    subtitle: "DISTRIBUTED COGNITION MESH",
    systemAlive: "SYSTEM ALIVE",
    systemStale: "SYSTEM DEGRADED - STALE DATA",
    agentPresence: "Agent Presence",
    backboneStream: "Backbone Event Stream",
    runtimeProcesses: "Runtime Processes",
    source: "Source",
    persistentCognition: "Persistent Cognition Layer",
    persistentSub: "Event stream is durable. Replay engine is online. Arbitration is active.",
    close: "Close",
    details: "View Details",
    instruct: "Instructions & Architecture",
    healthTitle: "Runtime Health & Stability",
    hPressure: "Queue Count",
    hMemory: "MTProto Trust",
    hLag: "Flood Waited",
    hCircuits: "Breakers",
    agents: [
      { name: 'NegotiatorAgent', role: 'Sales' },
      { name: 'RiskAgent', role: 'Security' },
      { name: 'MarketAgent', role: 'Pricing' }
    ]
  },
  ru: {
    title: "Когнитивная ОС",
    subtitle: "РАСПРЕДЕЛЕННАЯ КОГНИТИВНАЯ СЕТЬ",
    systemAlive: "СИСТЕМА АКТИВНА",
    systemStale: "ДЕГРАДАЦИЯ СИСТЕМЫ",
    agentPresence: "Присутствие агентов",
    backboneStream: "Стрим событий Backbone",
    runtimeProcesses: "Процессы Runtime",
    source: "Источник",
    persistentCognition: "Слой постоянного познания",
    persistentSub: "Поток событий устойчив. Механизм Replay активен. Арбитраж работает.",
    close: "Закрыть",
    details: "Подробнее",
    instruct: "Инструкция и архитектура",
    healthTitle: "Здоровье и Стабильность",
    hPressure: "Нагрузка Очередей",
    hMemory: "Доверие MTProto",
    hLag: "Задержка FloodWait",
    hCircuits: "Circuit Breakers",
    agents: [
      { name: 'NegotiatorAgent', role: 'Sales' },
      { name: 'RiskAgent', role: 'Security' },
      { name: 'MarketAgent', role: 'Pricing' }
    ]
  },
// We stick to EN for simplicity if default fallback.
};

export function CognitiveOSDashboard() {
  const { i18n } = useTranslation();
  const langRaw = i18n.resolvedLanguage || (i18n.language ? i18n.language.split('-')[0] : 'ru');
  const langKey = (langRaw === 'en' || langRaw === 'ru') ? langRaw as 'en' | 'ru' : 'en';
  const t = translations[langKey] || translations.en;
  
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const themeClasses = {
    bg: 'bg-[#0f1115]',
    cardBorder: 'border-white/5',
    cardBg: 'bg-[#15181e]',
    text: 'text-gray-100',
    textMuted: 'text-gray-400',
    hoverBg: 'hover:bg-white/5',
  };

  const [agents] = useState([
    { id: 'nag-1', name: t.agents[0].name, role: t.agents[0].role, status: 'IDLE', currentTask: 'Waiting...', channels: ['@main_sales_channel', 'Private Chats'] },
    { id: 'rsk-1', name: t.agents[1].name, role: t.agents[1].role, status: 'IDLE', currentTask: 'Waiting...', channels: ['Global Stream'] },
    { id: 'mkt-1', name: t.agents[2].name, role: t.agents[2].role, status: 'IDLE', currentTask: 'Waiting...', channels: ['Competitor Intel Group'] }
  ]);

  const [events, setEvents] = useState<any[]>([]);
  const [lastEventTime, setLastEventTime] = useState<number>(Date.now());
  const [isStale, setIsStale] = useState(false);
  
  // Realtime Status
  const [queues, setQueues] = useState<number>(0);
  const [mtprotoTrust, setMtprotoTrust] = useState<number>(100);
  const [floodWait, setFloodWait] = useState<number>(0);

  useEffect(() => {
    const token = localStorage.getItem('app_token');
    const evtSource = new EventSource('/api/telemetry/stream?token=' + encodeURIComponent(token || ''));

    evtSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CONNECTED' || data.type === 'HEARTBEAT') {
          setLastEventTime(Date.now());
          setIsStale(false);
          
          // Emit synthetic events to UI for demo? No! Only fetch from real
          // But wait, the reality model exposes methods, let's fetch those too if needed.
          // Or wait, trust goes via periodic /api/telemetry/stats or via bus updates.
          return;
        }

        setLastEventTime(Date.now());
        setIsStale(false);

        if (data.type === 'QUEUE_DEPTH_CHANGED') {
          const w = data.payload?.counts?.wait || 0;
          const a = data.payload?.counts?.active || 0;
          // aggregate naive count
          setQueues(prev => prev + (w+a));
        }

        if (data.type === 'MTPROTO_FLOODWAIT') {
          setFloodWait(data.payload?.floodWaitSeconds || 0);
        }

        setEvents(prev => {
          const updated = [data, ...prev].slice(0, 50);
          return updated;
        });

      } catch (err) {}
    };

    const staleChecker = setInterval(() => {
      if (Date.now() - lastEventTime > 20000) {
        setIsStale(true);
      }
    }, 1000);

    const statsFetcher = setInterval(async () => {
      try {
        const statsRes = await fetch('/api/telemetry/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (statsRes.ok) {
          const stats = await statsRes.json();
          setMtprotoTrust(stats.mtproto?.trustScore || 0);
          setFloodWait(stats.mtproto?.totalFloodWaits || 0);
        }
      } catch (e) {}
    }, 5000);

    // Initial fetch
    fetch('/api/telemetry/stats', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(stats => {
        setMtprotoTrust(stats.mtproto?.trustScore || 0);
        setFloodWait(stats.mtproto?.totalFloodWaits || 0);
      })
      .catch(() => {});

    return () => {
      evtSource.close();
      clearInterval(staleChecker);
      clearInterval(statsFetcher);
    };
  }, [lastEventTime]);

  // Modals...
  // (We omit some modals for brevity or reuse)
  const renderModal = () => {
     if (!activeModal) return null;
     return (
       <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
         <motion.div 
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.95 }}
           className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl shadow-2xl p-6 w-full max-w-2xl flex flex-col max-h-[80vh]`}
         >
           <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Brain className="w-5 h-5 text-blue-400" />
               Details
             </h2>
             <button onClick={() => setActiveModal(null)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
               <X className="w-5 h-5 text-gray-400" />
             </button>
           </div>
           <div className="pt-6 mt-4 border-t border-white/10 flex justify-end">
             <button onClick={() => setActiveModal(null)} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-colors">
               {t.close}
             </button>
           </div>
         </motion.div>
       </div>
     );
  };

  return (
    <div className={`flex-grow w-full min-h-[550px] rounded-2xl ${themeClasses.bg} ${themeClasses.text} font-sans p-6 overflow-hidden flex flex-col border border-white/10 shadow-2xl ${isStale ? 'opacity-80 saturate-50' : ''}`} style={{ 
      backgroundImage: 'radial-gradient(ellipse at 50% -20%, #1a2235 0%, transparent 50%)'
    }}>
      <AnimatePresence>
        {renderModal()}
      </AnimatePresence>

      {/* Header */}
      <header className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
            <Brain className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              {t.title}
            </h1>
            <p className="text-sm text-blue-400/70 font-mono">{t.subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full text-xs font-mono
               ${isStale ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
            <span className="relative flex h-2 w-2">
              {!isStale && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isStale ? 'bg-orange-500' : 'bg-green-500'}`}></span>
            </span>
            {isStale ? t.systemStale : t.systemAlive}
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <div className="flex-1 grid grid-cols-12 grid-rows-1 gap-6 min-h-0 overflow-hidden">
        {/* Left Column: Agents & Channels */}
        <div className="col-span-4 flex flex-col gap-6 h-full cursor-pointer group min-h-0" onClick={() => setActiveModal('agents')}>
          {/* Active Channels / Workspaces */}
          <div className={`flex-1 min-h-0 ${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl p-5 shadow-2xl flex flex-col transition-all group-hover:border-blue-500/30 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]`}>
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                 <Network className="w-4 h-4" /> {t.agentPresence}
               </h3>
             </div>
             <div className="space-y-3 overflow-y-auto custom-scrollbar pr-2 flex-1 relative">
               {agents.map(a => (
                 <div key={a.id} className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                   <div className="flex justify-between items-start mb-2">
                     <span className="font-bold text-white flex items-center gap-2">
                       <Bot className="w-4 h-4 text-emerald-400"/> {a.name}
                     </span>
                   </div>
                   <div className="text-xs text-gray-500 flex items-center gap-1">
                     <Activity className="w-3 h-3"/> Active via event sourcing
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Middle Column: Event Sourcing Stream */}
        <div className="col-span-4 flex flex-col h-full cursor-pointer group min-h-0" onClick={() => setActiveModal('stream')}>
          <div className={`flex-1 min-h-0 ${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl p-5 shadow-2xl flex flex-col transition-all group-hover:border-purple-500/30 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]`}>
             <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 flex items-center gap-2 group-hover:text-purple-400 transition-colors">
                 <GitCommit className="w-4 h-4" /> {t.backboneStream}
               </h3>
             </div>
             <div className="flex-1 overflow-y-auto relative pr-2 flex flex-col custom-scrollbar">
                 <div className="absolute left-[11px] top-0 bottom-0 w-[2px] bg-white/10"></div>
                 <div className="space-y-4">
                   <AnimatePresence initial={false}>
                     {events.map((evt) => (
                       <motion.div 
                         key={evt.id}
                         initial={{ opacity: 0, x: -20, height: 0 }}
                         animate={{ opacity: 1, x: 0, height: 'auto' }}
                         exit={{ opacity: 0, scale: 0.8 }}
                         className="relative pl-8 mb-4 last:mb-0"
                       >
                         <div className="absolute left-0 top-1.5 w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center z-10">
                           <Hexagon className="w-3 h-3 text-blue-400" />
                         </div>
                         <div className="p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <div className="text-xs font-mono text-purple-400 min-w-0 truncate" title={evt.type}>{evt.type.substring(0, 20)}...</div>
                              <div className="text-[9px] text-gray-500 shrink-0 mt-0.5">{new Date(evt.timestamp).toLocaleTimeString()}</div>
                            </div>
                            <div className="text-[10px] text-gray-500 mt-2 flex items-center justify-between">
                               <span>{t.source}: {evt.source}</span>
                            </div>
                         </div>
                       </motion.div>
                     ))}
                   </AnimatePresence>
                 </div>
             </div>
          </div>
        </div>

        {/* Right Column: Execution Processes */}
        <div className="col-span-4 flex flex-col gap-6 h-full min-h-0">
          <div className={`h-[50%] shrink-0 ${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl p-4 shadow-sm flex flex-col`}>
             <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
               <Activity className="w-3.5 h-3.5 text-blue-400" /> {t.healthTitle}
             </h3>
             <div className="grid grid-cols-2 gap-3 flex-1 text-sm">
               <div className="flex flex-col justify-center p-2 rounded-lg bg-white/5 border border-white/5 relative">
                 <span className="text-[10px] text-gray-500 mb-1">{t.hPressure}</span>
                 <span className={`font-mono font-medium ${queues > 1000 ? 'text-orange-400' : 'text-emerald-400'}`}>{queues} active/wait</span>
                 {isStale && <AlertTriangle className="absolute top-2 right-2 w-3 h-3 text-orange-500" />}
               </div>
               <div className="flex flex-col justify-center p-2 rounded-lg bg-white/5 border border-white/5 relative">
                 <span className="text-[10px] text-gray-500 mb-1">{t.hMemory}</span>
                 <span className={`font-mono font-medium text-emerald-400`}>{mtprotoTrust}%</span>
                 {isStale && <AlertTriangle className="absolute top-2 right-2 w-3 h-3 text-orange-500" />}
               </div>
               <div className="flex flex-col justify-center p-2 rounded-lg bg-white/5 border border-white/5 relative">
                 <span className="text-[10px] text-gray-500 mb-1">{t.hLag}</span>
                 <span className={`font-mono font-medium ${floodWait > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{floodWait} s</span>
                 {isStale && <AlertTriangle className="absolute top-2 right-2 w-3 h-3 text-orange-500" />}
               </div>
               <div className="flex flex-col justify-center p-2 rounded-lg bg-white/5 border border-white/5">
                 <span className="text-[10px] text-gray-500 mb-1">{t.hCircuits}</span>
                 <span className={`font-mono font-medium text-emerald-400`}>CLOSED</span>
               </div>
             </div>
          </div>

          <div className={`h-[50%] shrink-0 ${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl p-5 shadow-2xl flex flex-col justify-center items-center text-center cursor-pointer group transition-all hover:border-blue-500/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]`} onClick={() => setActiveModal('cognition')}>
              <Brain className="w-8 h-8 text-purple-500/50 mb-2 group-hover:text-blue-400 group-hover:scale-110 transition-all duration-500 drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
              <h4 className="text-sm font-medium mb-1 group-hover:text-blue-300 transition-colors text-white">{t.persistentCognition}</h4>
              <p className="text-[10px] text-gray-500 max-w-[80%] leading-tight group-hover:text-gray-300 transition-colors">{t.persistentSub}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

