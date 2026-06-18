import React, { memo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Lock, AlertTriangle, Snowflake, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const RuntimeTelemetry = memo(() => {
  const { t } = useTranslation();
  const [pulse, setPulse] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => setPulse(p => !p), 1000);
    return () => clearInterval(interval);
  }, []);

  const logs = [
    { time: '12:31:04', log: 'INGEST_PACKET', type: 'SUCCESS' },
    { time: '12:31:04', log: 'SANITIZE_CONTENT', type: 'SUCCESS' },
    { time: '12:31:04', log: 'VECTOR_SIMILARITY', type: 'SUCCESS' },
    { time: '12:31:05', log: 'ROUTE_ASSIGNMENT', type: 'ROUTING' },
    { time: '12:31:05', log: 'QUEUE_DISPATCH', type: 'SUCCESS' },
    { time: '12:31:06', log: 'MTProto_SEND', type: 'WARNING' },
    { time: '12:31:06', log: 'ACK_RECEIVED', type: 'SUCCESS' },
    { time: '12:31:07', log: 'STATE_COMMITTED', type: 'SUCCESS' }
  ];

  const logColors: Record<string, string> = {
    'SUCCESS': 'text-[#22C55E] drop-shadow-[0_0_5px_rgba(34,197,94,0.4)]',
    'ROUTING': 'text-[#00D1FF] drop-shadow-[0_0_5px_rgba(0,209,255,0.4)]',
    'WARNING': 'text-[#F59E0B] drop-shadow-[0_0_5px_rgba(245,158,11,0.4)]',
    'FAILURE': 'text-[#EF4444] drop-shadow-[0_0_5px_rgba(239,68,68,0.4)]',
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLogIndex(prev => (prev < logs.length ? prev + 1 : 0));
    }, 1200);
    return () => clearInterval(interval);
  }, [logs.length]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative w-full min-h-[800px] flex flex-col items-center justify-center py-16 font-sans overflow-visible"
    >
       {/* Ambient Glow Orb */}
       <motion.div 
         className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full pointer-events-none z-0"
         style={{ filter: 'blur(100px)', background: 'radial-gradient(circle, rgba(16,185,129,0.25) 0%, rgba(59,130,246,0.15) 60%, rgba(0,0,0,0) 80%)' }}
         animate={{ opacity: [0.7, 1, 0.7], scale: [0.95, 1.05, 0.95] }}
         transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
       />

       {/* Floating Perspective Wrapper */}
       <div className="relative w-full max-w-[950px] z-10 px-4" style={{ perspective: '2000px' }}>
         <motion.div 
           className="relative w-full flex flex-col overflow-hidden"
           style={{ 
             borderRadius: '32px 48px 90px 24px',
             background: 'rgba(8,15,30,0.72)',
             backdropFilter: 'blur(40px)',
             boxShadow: 'inset 0 0 120px rgba(59,130,246,0.12), inset 0 0 40px rgba(255,255,255,0.03), 0 40px 120px rgba(0,0,0,0.65), 0 0 20px rgba(59,130,246,0.12)',
             border: '1px solid rgba(80,160,255,0.22)',
             transformStyle: 'preserve-3d'
           }}
           animate={{ y: [-8, 8, -8] }}
           transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
           whileHover={{ y: -12, rotateX: 1, rotateY: -1, z: 20, transition: { duration: 0.8, ease: 'easeOut' } }}
         >
            {/* Deep Space Grid */}
            <div 
               className="absolute inset-0 pointer-events-none -z-10"
               style={{
                 backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
                 backgroundSize: '40px 40px',
                 backgroundPosition: 'center center'
               }}
            />
            {/* Cinematic Noise */}
            <div className="absolute inset-0 mix-blend-overlay opacity-[0.03] pointer-events-none -z-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.95\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>

            {/* Header Area */}
            <div className="px-6 sm:px-8 py-5 sm:py-7 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-blue-500/20 bg-black/20 gap-6 w-full">
               <div className="flex items-center gap-4">
                 <h3 className="text-white font-bold tracking-[-0.05em] text-xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">Runtime Telemetry Fabric</h3>
                 <div className="flex items-center gap-2">
                   <motion.div 
                      animate={{ opacity: [1, 0.4, 1], scale: [1, 0.8, 1] }} 
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-2 h-2 rounded-full bg-[#22C55E] flex items-center justify-center shadow-[0_0_10px_#22c55e]"
                   />
                   <span className="text-[#22C55E] text-[11px] font-bold uppercase tracking-[0.18em]">Live</span>
                 </div>
               </div>
               
               <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                   <div className="flex flex-col gap-1">
                     <span className="text-[11px] uppercase tracking-[0.18em] text-blue-300/70">QPS</span>
                     <div className="flex items-center gap-2">
                       <span className="text-white text-[15px] font-mono leading-none">1.24K</span>
                       <MiniSparkline color="#3b82f6" />
                     </div>
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[11px] uppercase tracking-[0.18em] text-blue-300/70">RTT</span>
                     <div className="flex items-center gap-2">
                       <span className="text-white text-[15px] font-mono leading-none">128ms</span>
                       <MiniSparkline color="#00D1FF" />
                     </div>
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[11px] uppercase tracking-[0.18em] text-blue-300/70">Queue Depth</span>
                     <div className="flex items-center gap-2">
                        <span className="text-white text-[15px] font-mono leading-none">2.7K</span>
                     </div>
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[11px] uppercase tracking-[0.18em] text-blue-300/70">MTProto</span>
                     <span className="text-[#22C55E] text-[15px] drop-shadow-[0_0_5px_rgba(34,197,94,0.4)] font-mono leading-none font-medium uppercase">Connected</span>
                   </div>
               </div>
            </div>

            {/* Main Body */}
            <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
               
               {/* Left Group */}
               <div className="flex flex-col gap-8">
                  
                  {/* Routing Matrix */}
                  <div className="flex flex-col gap-3 group">
                     <h4 className="text-[11px] uppercase tracking-[0.18em] text-blue-300/70 ml-1">Routing Matrix</h4>
                     <div className="flex flex-col gap-1 w-full bg-[#030712]/40 rounded-xl border border-white/5 p-3 overflow-x-auto shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]">
                        <div className="grid grid-cols-7 gap-3 mb-2 px-3 pb-2 text-[10px] uppercase font-bold tracking-[0.15em] text-white/40 border-b border-white/5 min-w-[500px]">
                          <span>Node</span>
                          <span className="col-span-2">Target</span>
                          <span>QPS</span>
                          <span>Delay</span>
                          <span>Wait</span>
                          <span className="text-right">Trust</span>
                        </div>
                        
                        {[
                          { n: 'NODE-01', t: 'TG-DISPATCH', tc: 'text-[#00D1FF]', q: 420, d: '95ms', f: 2, tr: 98 },
                          { n: 'NODE-02', t: 'AI-SANITIZE', tc: 'text-[#22C55E]', q: 312, d: '78ms', f: 0, tr: 99 },
                          { n: 'NODE-03', t: 'CRM-QUEUE',  tc: 'text-[#7C3AED]', q: 198, d: '120ms', f: 1, tr: 97 },
                          { n: 'NODE-04', t: 'RETRY-FABRIC', tc: 'text-[#00D1FF]', q: 156, d: '210ms', f: 4, fc: 'text-[#F59E0B]', tr: 95 },
                        ].map((r, i) => (
                           <div key={i} className="grid grid-cols-7 gap-3 px-3 py-2 text-[12px] font-mono text-white/70 min-w-[500px] border border-transparent hover:border-blue-500/30 hover:bg-blue-500/10 rounded-lg transition-all duration-300 items-center">
                              <span className="text-[#64748B]">{r.n}</span>
                              <span className={`col-span-2 ${r.tc} drop-shadow-[0_0_8px_currentColor]`}>{r.t}</span>
                              <span>{r.q}</span>
                              <span>{r.d}</span>
                              <span className={r.fc || 'text-white/40'}>{r.f}</span>
                              <span className={`text-right font-bold ${r.tr >= 98 ? 'text-[#22C55E]' : r.tr >= 90 ? 'text-[#F59E0B]' : 'text-[#EF4444]'}`}>{r.tr}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Queues Layout */}
                  <div className="flex flex-col gap-3">
                     <h4 className="text-[11px] uppercase tracking-[0.18em] text-blue-300/70 ml-1">Queues Telemetry</h4>
                     <div className="flex flex-col gap-3 bg-[#030712]/40 rounded-xl border border-white/5 p-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] h-full">
                        <QueueRow name="Rewrite Queue" val="842" color="bg-[#2563EB]" w="w-[70%]" sparkline="#2563EB" logIndex={logIndex} m={1} />
                        <QueueRow name="Dispatch Queue" val="1.3K" color="bg-[#7C3AED]" w="w-[90%]" sparkline="#7C3AED" logIndex={logIndex} m={1.2} />
                        <QueueRow name="Retry Queue" val="412" color="bg-[#F59E0B]" w="w-[40%]" sparkline="#F59E0B" logIndex={logIndex} m={0.8} />
                        <QueueRow name="DLQ" val="27" color="bg-[#EF4444]" w="w-[10%]" sparkline="#EF4444" logIndex={logIndex} m={0.4} />
                     </div>
                  </div>

               </div>

               {/* Right Group: Event Stream & Governance */}
               <div className="flex flex-col gap-8 h-full">
                  <div className="flex flex-col gap-3 flex-1">
                     <h4 className="text-[11px] uppercase tracking-[0.18em] text-blue-300/70 ml-1">Event Stream</h4>
                     <div className="flex-1 bg-[#030712]/60 rounded-xl border border-white/5 p-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col font-mono text-[11px] md:text-[12px] leading-relaxed relative min-h-[250px] md:min-h-[280px]">
                        {/* Hardware scanline effect */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0),rgba(0,0,0,0.1)_50%,rgba(0,0,0,0))] bg-[length:100%_4px] mix-blend-overlay pointer-events-none -z-0"></div>
                        <AnimatePresence>
                           {logs.slice(0, logIndex === 0 ? logs.length : logIndex).map((l, idx) => (
                              <motion.div 
                                key={idx}
                                initial={{ opacity: 0, x: 10, backgroundColor: 'rgba(255,255,255,0.05)' }} 
                                animate={{ opacity: 1, x: 0, backgroundColor: 'rgba(255,255,255,0)' }}
                                className="flex gap-4 py-1 relative z-10"
                              >
                                <span className="text-[#64748B] opacity-50 shrink-0">{l.time}</span>
                                <span className={`${logColors[l.type]} font-medium`}>{l.log}</span>
                              </motion.div>
                           ))}
                        </AnimatePresence>
                        <motion.div animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} className="w-2 h-4 bg-white/40 mt-1 relative z-10"></motion.div>
                     </div>
                  </div>
                  
                  {/* Governance */}
                  <div className="flex flex-col gap-3">
                     <h4 className="text-[11px] uppercase tracking-[0.18em] text-blue-300/70 ml-1">Governance Controls</h4>
                     <div className="grid grid-cols-2 gap-3 shrink-0">
                        <GovButton icon={<Square size={14}/>} label="Pause Dispatch" color="hover:border-[#F59E0B]/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] text-[#F59E0B]" />
                        <GovButton icon={<Lock size={14}/>} label="Lock Routing" color="hover:border-[#2563EB]/50 hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] text-[#2563EB]" />
                        <GovButton icon={<AlertTriangle size={14}/>} label="Enter Safe Mode" color="hover:border-[#EF4444]/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.3)] text-[#EF4444]" />
                        <GovButton icon={<Snowflake size={14}/>} label="Freeze Queue" color="hover:border-[#7C3AED]/50 hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] text-[#7C3AED]" />
                     </div>
                  </div>
               </div>

            </div>

            {/* Bottom KPI Dashboard */}
            <div className="border-t border-blue-500/20 bg-black/40 px-6 sm:px-8 py-5 grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-white/5">
                <BottomMetric label="Telemetry Age" val="1.2s" chartColor="#00D1FF" log={logIndex} />
                <BottomMetric label="Dispatch Latency" val="128ms" chartColor="#2563EB" log={logIndex} />
                <BottomMetric label="FloodWait Risk" val="Low" valColor="text-[#22C55E]" chartColor="#22C55E" log={logIndex} />
                <BottomMetric label="System Health" val="98.6%" chartColor="#7C3AED" log={logIndex} />
            </div>

         </motion.div>
       </div>
    </motion.div>
  );
});

export default RuntimeTelemetry;

const BottomMetric = ({ label, val, valColor = 'text-white', chartColor, log }: any) => (
   <div className="flex flex-col pl-4 first:pl-0 gap-1.5">
      <span className="text-[9px] sm:text-[10px] tracking-[0.18em] uppercase text-blue-300/50">{label}</span>
      <div className="flex items-center justify-between mt-1">
         <span className={`${valColor} text-[15px] sm:text-lg font-mono leading-none`}>{val}</span>
         <div className="w-12 h-4 opacity-80" style={{ transform: `translateY(${Math.sin(log)*2}px)` }}>
            <MiniSparkline color={chartColor} strokeWidth="1" />
         </div>
      </div>
   </div>
);

const GovButton = ({ icon, label, color }: any) => (
  <button className={`bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.06)] backdrop-blur-xl hover:-translate-y-0.5 transition-all duration-300 rounded-lg flex flex-row items-center justify-start gap-3 px-4 py-3.5 ${color} relative overflow-hidden group`}>
     <div className="absolute inset-0 bg-gradient-to-r from-current/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
     <div className="shrink-0">{icon}</div>
     <span className="text-[10px] sm:text-[11px] leading-tight text-white/80 shrink-0 text-left font-bold">{label}</span>
  </button>
);

const QueueRow = ({ name, val, color, w, sparkline, logIndex, m }: any) => {
  const animatedWidth = `calc(${w.replace('w-[', '').replace('%]', '')}% * ${1 + (logIndex ? Math.sin(logIndex * m) * 0.05 : 0)})`;
  return (
  <div className="flex items-center gap-3 w-full">
    <span className="w-16 sm:w-20 text-[10px] sm:text-[11px] text-[#64748B] uppercase tracking-[0.15em] shrink-0 font-bold">{name}</span>
    <div className="flex-1 h-[2px] bg-white/5 rounded-full relative overflow-hidden">
       <motion.div 
         animate={{ width: animatedWidth }}
         transition={{ duration: 1, ease: 'easeOut' }}
         className={`absolute top-0 bottom-0 left-0 ${color} shadow-[0_0_10px_currentColor]`}
       />
    </div>
    <span className="w-10 text-right text-[11px] sm:text-[12px] font-mono text-white/90 shrink-0">{val}</span>
  </div>
  );
};

const MiniSparkline = ({ color, strokeWidth = "1.5" }: { color: string, strokeWidth?: string }) => (
  <svg viewBox="0 0 100 20" className="w-12 sm:w-16 h-4 sm:h-5 overflow-visible shrink-0 drop-shadow-[0_0_4px_currentColor]">
    <path d="M0,15 L15,10 L30,12 L45,5 L60,8 L75,2 L100,5" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

