import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Activity, BrainCircuit, Waves, GitMerge, FileCheck, HelpCircle, TreePine, Sparkles, Send, Inbox, Hexagon, Database, CheckCircle2, Calendar, Clock, TerminalSquare, AlertTriangle, PlayCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const CinematicFeatures = () => {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = React.useState(true);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const getWebRingPath = (r: number, sagFactor: number) => {
    let path = '';
    for (let j = 0; j < 8; j++) {
      const t1 = j * Math.PI / 4 + Math.PI / 8;
      const t2 = (j + 1) * Math.PI / 4 + Math.PI / 8;
      
      const x1 = 50 + r * Math.cos(t1);
      const y1 = 50 + r * Math.sin(t1);
      
      const x2 = 50 + r * Math.cos(t2);
      const y2 = 50 + r * Math.sin(t2);
      
      const mid_theta = (t1 + t2) / 2;
      const cx = 50 + (r * sagFactor) * Math.cos(mid_theta);
      const cy = 50 + (r * sagFactor) * Math.sin(mid_theta);
      
      if (j === 0) {
        path += `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
      } else {
        path += ` Q ${cx} ${cy} ${x2} ${y2}`;
      }
    }
    path += ' Z';
    return path;
  };

  React.useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((current) => (current + 1) % 4);
    }, 4000); // slightly slower
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  return (
    <div className={`w-full flex justify-center py-16 transition-all duration-500 ${isFullscreen ? 'fixed inset-0 bg-[#070b14]/98 z-[99999] overflow-y-auto px-4 sm:px-8 py-10 backdrop-blur-3xl' : ''}`}>
      <div className={`w-full transition-all duration-500 flex flex-col justify-center ${isFullscreen ? 'max-w-7xl h-full space-y-6' : 'max-w-screen-xl space-y-24 px-4 sm:px-6 md:px-8'}`}>
        
        {/* Fullscreen header */}
        {isFullscreen && (
          <div className="w-full flex justify-between items-center pb-4 border-b border-white/5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <span className="text-white text-lg font-bold tracking-tight">TeleSync OS Showcase</span>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 rounded-full hidden sm:inline-block">LIVE DEMO STATE</span>
            </div>
            <button 
              onClick={() => setIsFullscreen(false)}
              className="px-4 py-1.5 rounded-lg border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-400 hover:text-white text-xs font-mono transition-all"
              title="Закрыть демонстрационный терминал"
            >
              EXIT FULLSCREEN [ESC]
            </button>
          </div>
        )}

        {/* GitHub-style Accordion Feature Section */}
        <div className={`flex flex-col lg:flex-row gap-12 lg:gap-20 transition-all duration-300 ${isFullscreen ? 'w-full flex-1 md:items-stretch overflow-hidden' : 'pb-16'}`}>
          
          {/* Left Column - Accordion */}
          <div className="w-full lg:w-[45%] flex flex-col justify-center gap-0">
            {[              {
                id: "f1",
                title: t('cinematic.f1_title', "Verified Telemetry Fabric"),
                desc: t('cinematic.f1_desc', "Authoritative runtime telemetry with staleness detection and SSE synchronization."),
                linkText: t('cinematic.explore_telemetry', "Explore Telemetry"),
                tooltip: "Инспектировать входящий поток телеметрических сырых данных"
              },
              {
                id: "f2",
                title: t('cinematic.f2_title', "MTProto Reality Layer"),
                desc: t('cinematic.f2_desc', "FloodWait-aware dispatch orchestration with live trust degradation tracking."),
                linkText: t('cinematic.explore_routing', "Explore Routing"),
                tooltip: "Настроить параметры маршрутов и лимитов MTProto"
              },
              {
                id: "f3",
                title: t('cinematic.f3_title', "Runtime Governance"),
                desc: t('cinematic.f3_desc', "Immutable operational actions with audit-linked execution envelopes."),
                linkText: t('cinematic.explore_gov', "Explore Governance"),
                tooltip: "Инициализировать смарт-контрактный аудит"
              },
              {
                id: "f4",
                title: t('cinematic.f4_title', "AI Moderation Diff"),
                desc: t('cinematic.f4_desc', "Policy-level sanitization tracking with before/after semantic diff inspection."),
                linkText: t('cinematic.explore_ai', "Explore AI Moderation"),
                tooltip: "Проверить правила безопасности модерации ИИ"
              }].map((feat, index) => {
               const isActive = index === activeIndex % 4; // Use modulo 4 since we only have 4 here
               return (
                 <div 
                   key={feat.id}
                   onClick={() => {
                     setActiveIndex(index);
                     setIsAutoPlaying(false);
                   }}
                   className={`relative cursor-pointer transition-all duration-300 border-t border-white/10 ${index === 3 ? 'border-b' : ''} ${isActive ? 'py-8' : 'py-6'} group/item`}
                 >
                   {/* Hover Tooltip explaining function of the button item */}
                   <div className="absolute right-0 top-3 mb-1 px-2.5 py-1.5 bg-gray-900 border border-white/10 rounded-lg text-[10px] text-gray-300 font-sans tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover/item:opacity-100 transition-opacity duration-200 z-50">
                     {feat.tooltip}
                     <div className="absolute bottom-full right-4 border-4 border-transparent border-b-gray-900"></div>
                   </div>

                   <div className="flex justify-between items-center group">
                      <h3 className={`text-[20px] md:text-[24px] lg:text-[28px] tracking-tight font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-[#8E9CAE] group-hover:text-white'}`}>
                        {feat.title}
                      </h3>
                      {!isActive && (
                        <svg className="text-[#8E9CAE] group-hover:text-white transition-colors duration-300 ml-4 flex-shrink-0" viewBox="0 0 16 16" width="20" height="20" fill="currentColor">
                          <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z"></path>
                        </svg>
                      )}
                   </div>
                   
                   <AnimatePresence initial={false}>
                     {isActive && (
                       <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         transition={{ duration: 0.3 }}
                         className="overflow-hidden"
                       >
                         <div className="pt-4">
                           <p className="text-[#8E9CAE] text-base md:text-lg mb-4 max-w-lg leading-relaxed">{feat.desc}</p>
                           
                           {/* Hover tooltip for link buttons */}
                           <div className="relative group/link-tooltip inline-block">
                             <a href="#" className="font-semibold text-base md:text-lg text-white hover:opacity-80 group inline-flex items-center gap-2 transition-opacity">
                               {feat.linkText} <span className="font-light text-xl transition-transform group-hover:translate-x-1">›</span>
                             </a>
                             <div className="absolute top-full mt-2 left-0 px-3 py-1.5 bg-gray-900 border border-white/10 rounded-lg text-[10px] text-gray-300 font-sans tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover/link-tooltip:opacity-100 transition-opacity duration-200 z-[9999]">
                               {index === 0 && "Открыть интерактивный граф связи телеметрических метрик"}
                               {index === 1 && "Исследовать MTProto FloodWait логи и распределенные маршруты"}
                               {index === 2 && "Проверить защищенный блокчейн смарт-политик аудита действий"}
                               {index === 3 && "Инспектировать историю ИИ-модерации чатов и безопасных замен"}
                               <div className="absolute bottom-full left-4 border-4 border-transparent border-b-gray-900"></div>
                             </div>
                           </div>
                         </div>
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </div>
               )
            })}
          </div>

          {/* Right Column - UI Display - stretched down to 580px */}
          <div className="w-full lg:w-[55%] relative flex flex-col h-full justify-stretch">
             <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-blue-500/20 to-transparent rounded-[32px] blur-[60px] -z-10 opacity-60"></div>
             
             <div className={`relative bg-[#0d1117]/80 backdrop-blur-xl rounded-[24px] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col transition-all duration-500 ${isFullscreen ? 'flex-1 min-h-[480px] h-[55vh]' : 'min-h-[500px] lg:h-[580px]'}`}>
                
                {/* Simulated Operating System Header */}
                <div className="bg-[#161b22] px-4 py-3.5 border-b border-white/10 flex justify-between items-center bg-[#0d1117]/50 relative z-30 flex-shrink-0 select-none">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                    <span className="w-3 h-3 rounded-full bg-green-500/80"></span>
                    <span className="text-gray-400 font-mono text-xs ml-3 hidden sm:inline">telesync://runtime/mesh-display</span>
                  </div>
                  
                  {/* Controls with explicit tooltips on hover */}
                  <div className="flex items-center gap-3">
                    {/* Auto Play Selector Button with Tooltip */}
                    <div className="relative group/tooltip">
                      <button 
                        onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                        className={`p-1 px-2.5 rounded-full text-[10px] font-mono border transition-all flex items-center gap-1.5 ${isAutoPlaying ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isAutoPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></span>
                        {isAutoPlaying ? "AUTO LIVE" : "PAUSED"}
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-gray-900 border border-white/10 rounded-lg text-[10px] text-gray-200 shadow-2xl tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-[9999] translate-y-1 group-hover/tooltip:translate-y-0">
                        {isAutoPlaying ? "Авто-прокрутка презентации запущена. Нажмите для паузы." : "Авто-прокрутка приостановлена. Нажмите для авто-воспроизведения."}
                        <div className="absolute top-full right-5 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>

                    {/* Window Fullscreen Toggle Button with Tooltip */}
                    <div className="relative group/tooltip">
                      <button 
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1 px-2.5 h-6 rounded border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-gray-400 hover:text-white flex items-center justify-center text-[10px] font-mono"
                      >
                        {isFullscreen ? "EXIT [ESC]" : "FULLSCREEN"}
                      </button>
                      <div className="absolute bottom-full right-0 mb-2 px-2.5 py-1.5 bg-gray-900 border border-white/10 rounded-lg text-[10px] text-gray-200 shadow-2xl tracking-wide whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-[9999] translate-y-1 group-hover/tooltip:translate-y-0">
                        {isFullscreen ? "Закрыть полноэкранный терминал [ESC]" : "Развернуть интерактивный демонстратор на весь экран"}
                        <div className="absolute top-full right-5 border-4 border-transparent border-t-gray-900"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Content Pane */}
                <div className="flex-1 relative min-h-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeIndex % 4}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 p-4 lg:p-6 flex flex-col min-h-0 overflow-y-auto"
                    >
                       <ActiveFeatureDisplay index={activeIndex % 4} t={t} />
                    </motion.div>
                  </AnimatePresence>
                </div>
             </div>
          </div>
        </div>

        {/* Strip: Live Operation */}
        <div className="w-full bg-[#070b14]/90 border border-[#1e293b]/60 p-4 md:p-6 rounded-[24px] overflow-hidden shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_10px_40px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 relative z-10 divide-x divide-white/5">
             <MetricBlock title={t('cinematic.metric1', "NODE HEALTH")} value="98.6%" color="text-white" iconColor="text-emerald-400" chart={<MiniSparkline color="#10b981" />} />
             <MetricBlock title={t('cinematic.metric2', "QUEUE PRESSURE")} value={t('cinematic.val_med', "Medium")} color="text-white" iconColor="text-yellow-500" chart={<BarsBlock color="#eab308" />} />
             <MetricBlock title={t('cinematic.metric3', "MTProto RTT")} value="128ms" color="text-white" iconColor="text-blue-500" chart={<MiniSparkline color="#3b82f6" />} />
             <MetricBlock title={t('cinematic.metric4', "RPC FAILURE RATE")} value="0.43%" color="text-white" iconColor="text-red-500" chart={<MiniSparkline color="#ef4444" />} />
             <MetricBlock title={t('cinematic.metric5', "TELEMETRY AGE")} value="1.2s" color="text-white" iconColor="text-emerald-400" chart={<MiniSparkline color="#10b981" />} />
             <MetricBlock title={t('cinematic.metric6', "DISPATCH LATENCY")} value="210ms" color="text-white" iconColor="text-purple-500" chart={<MiniSparkline color="#a855f7" />} />
          </div>
        </div>

        {/* Middle Section: Trust Panel & How it Works */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2.5fr] gap-4 md:gap-6">
          
          {/* Trust Panel */}
          <div className="bg-[#070b14]/90 border border-[#1e293b]/60 p-8 rounded-[32px] flex flex-col justify-between shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10 group-hover:bg-emerald-500/10 transition-colors duration-1000"></div>
            <div>
              <h3 className="text-[11px] tracking-[0.2em] uppercase text-gray-300 font-bold mb-10 text-shadow-sm">{t('cinematic.trust', 'TRUST & RISK OVERVIEW')}</h3>
              
              <div className="flex flex-col items-center justify-center mb-10 relative">
                {/* Radial visual effect */}
                <div className="w-56 h-56 relative flex items-center justify-center">
                  <motion.div
                    className="absolute inset-0"
                    initial={{ rotate: -90, scale: 0.8, opacity: 0 }}
                    whileInView={{ rotate: 0, scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                  >
                    <motion.div
                      className="absolute inset-0"
                    >
                      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                        <g>
                          {/* Inner soft glow */}
                          <circle cx="50" cy="50" r="24" fill="rgba(16,185,129,0.06)" className="drop-shadow-2xl" />
                          
                          {/* Web lines */}
                          {[...Array(8)].map((_, i) => (
                             <motion.line 
                               key={`line-${i}`} 
                               x1="50" 
                               y1="50" 
                               x2={50 + 44 * Math.cos(i * Math.PI / 4 + Math.PI/8)} 
                               y2={50 + 44 * Math.sin(i * Math.PI / 4 + Math.PI/8)} 
                               stroke="rgba(16,185,129,0.3)" 
                               strokeWidth="0.5" 
                               initial={{ pathLength: 0 }}
                               whileInView={{ pathLength: 1 }}
                               viewport={{ once: true }}
                               transition={{ duration: 1, delay: i * 0.1 }}
                             />
                          ))}
                          {/* Beautiful Curved Concentric Spider Web Rings */}
                          {[22, 33, 44].map((r, i) => {
                            const sagFactor = i === 0 ? 0.94 : i === 1 ? 0.91 : 0.88;
                            return (
                              <motion.path 
                                key={`web-ring-${i}`} 
                                d={getWebRingPath(r, sagFactor)} 
                                fill={i === 1 ? 'rgba(16,185,129,0.08)' : 'none'} 
                                stroke={i === 1 ? '#10b981' : 'rgba(16,185,129,0.4)'} 
                                strokeWidth={i === 1 ? 1.5 : 0.5}
                                initial={{ pathLength: 0, opacity: 0 }}
                                whileInView={{ pathLength: 1, opacity: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 1.5, delay: 0.5 + i * 0.2 }}
                                style={{ filter: i === 1 ? 'drop-shadow(0 0 10px rgba(16,185,129,0.7))' : 'none' }}
                              />
                            );
                          })}
                          {/* Glowing nodes on the middle octagon */}
                          {[...Array(8)].map((_, j) => (
                            <motion.circle 
                              key={`node-${j}`} 
                              cx={50 + 33 * Math.cos(j * Math.PI / 4 + Math.PI/8)} 
                              cy={50 + 33 * Math.sin(j * Math.PI / 4 + Math.PI/8)} 
                              r="1.8" 
                              fill="#6ee7b7" 
                              className="drop-shadow-[0_0_8px_rgba(16,185,129,1)]" 
                              initial={{ scale: 0, opacity: 0 }}
                              whileInView={{ scale: [0, 1.5, 1], opacity: 1 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.5, delay: 1 + j * 0.1 }}
                              animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.2, 1] }}
                              style={{ transformOrigin: 'center' }}
                            />
                          ))}
                        </g>
                      </svg>
                    </motion.div>
                  </motion.div>
                  {/* Central Score block */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
                    <motion.div 
                      className="text-white text-[32px] leading-none font-bold tracking-tighter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                      initial={{ scale: 0, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.8, delay: 1.5, type: 'spring' }}
                      viewport={{ once: true }}
                    >97</motion.div>
                    <motion.div 
                      className="text-[#10b981] text-[8px] uppercase tracking-widest font-bold mt-1 drop-shadow-md"
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      transition={{ duration: 0.8, delay: 1.8 }}
                      viewport={{ once: true }}
                    >{t('cinematic.trust_score', 'TRUST SCORE')}</motion.div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-5 font-mono text-[11px] text-[#8E9CAE]">
              <motion.div 
                className="flex justify-between items-end border-b border-white/[0.04] pb-3"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="leading-tight">
                  <div className="text-gray-300 font-sans tracking-wide mb-1">{t('cinematic.dp', 'Detection Pressure')}</div>
                  <div className="text-emerald-400 font-bold">{t('rt.low', 'Low')}</div>
                </div>
                <div className="text-right leading-tight">
                  <div className="text-emerald-400 font-bold mb-1">18%</div>
                  <div className="text-emerald-500/80 text-[10px]">↑12%</div>
                </div>
              </motion.div>
              <motion.div 
                className="flex justify-between items-end border-b border-white/[0.04] pb-3"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="leading-tight">
                  <div className="text-gray-300 font-sans tracking-wide mb-1">{t('cinematic.fe', 'Forward Entropy')}</div>
                  <div className="text-emerald-400 font-bold">{t('cinematic.good', 'Good')}</div>
                </div>
                <div className="text-right leading-tight">
                  <div className="text-emerald-400 font-bold mb-1">76%</div>
                  <div className="text-emerald-500/80 text-[10px]">↑8%</div>
                </div>
              </motion.div>
              <motion.div 
                className="flex justify-between items-end border-b border-white/[0.04] pb-3"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="leading-tight">
                  <div className="text-gray-300 font-sans tracking-wide mb-1">{t('cinematic.fr', 'FloodWait Risk')}</div>
                  <div className="text-emerald-400 font-bold">{t('rt.low', 'Low')}</div>
                </div>
                <div className="text-right leading-tight">
                  <div className="text-emerald-400 font-bold mb-1">18%</div>
                  <div className="text-emerald-500/80 text-[10px]">↓8%</div>
                </div>
              </motion.div>
              <motion.div 
                className="flex justify-between items-end"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                <div className="leading-tight">
                  <div className="text-gray-300 font-sans tracking-wide mb-1">{t('cinematic.ss', 'System Stability')}</div>
                  <div className="text-emerald-400 font-bold">{t('cinematic.ss_status', 'Nominal')}</div>
                </div>
                <div className="text-right leading-tight">
                  <div className="text-emerald-400 font-bold mb-1">96%</div>
                  <div className="text-emerald-500/80 text-[10px]">96%</div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Timeline / How it works */}
          <div className="bg-[#070b14]/90 border border-[#1e293b]/60 p-8 rounded-[32px] flex flex-col shadow-[0_10px_40px_rgba(0,0,0,0.5)] relative overflow-hidden">
            <h3 className="text-[11px] tracking-[0.2em] uppercase text-gray-300 font-bold mb-12">{t('cinematic.how', 'HOW IT WORKS')}</h3>
            
            <div className="relative flex-1 flex flex-col pt-4 pb-8">
               {/* Animated Matrix Text Block */}
               <div className="flex flex-col gap-2 z-0 justify-center items-center pointer-events-none mb-12">
                 <div className="flex flex-col items-center gap-2">
                   
                   <div className="relative inline-block text-[9px] sm:text-[10px] text-emerald-500 font-mono tracking-[0.2em] font-bold">
                      <div className="opacity-0 whitespace-nowrap pr-1">{t('cinematic.m1', '010110 INGESTING TELEMETRY * SYSTEM ACQUIRED')}</div>
                      <motion.div 
                        className="absolute top-0 left-0 bottom-0 overflow-hidden border-r-[2px] border-emerald-500 pr-1 flex items-center whitespace-nowrap"
                        style={{ textShadow: '0 0 5px rgba(16,185,129,0.5)' }}
                        initial={{ width: "0%" }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: "linear" }}
                      >
                        {t('cinematic.m1', '010110 INGESTING TELEMETRY * SYSTEM ACQUIRED')}
                      </motion.div>
                   </div>

                   <div className="relative inline-block text-[9px] sm:text-[10px] text-emerald-500 font-mono tracking-[0.2em] font-bold">
                      <div className="opacity-0 whitespace-nowrap pr-1">{t('cinematic.m2', '101011 SANITIZING PAYLOADS * ROUTING MATRIX')}</div>
                      <motion.div 
                        className="absolute top-0 left-0 bottom-0 overflow-hidden border-r-[2px] border-emerald-500 pr-1 flex items-center whitespace-nowrap"
                        style={{ textShadow: '0 0 5px rgba(16,185,129,0.5)' }}
                        initial={{ width: "0%" }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 1.5, ease: "linear" }}
                      >
                        {t('cinematic.m2', '101011 SANITIZING PAYLOADS * ROUTING MATRIX')}
                      </motion.div>
                   </div>
                   
                   <div className="relative inline-block text-[9px] sm:text-[10px] text-emerald-500 font-mono tracking-[0.2em] font-bold">
                      <div className="opacity-0 whitespace-nowrap pr-1">{t('cinematic.m3', '001100 QUEUE ORCHESTRATION * GOVERNANCE VERIFIED')}</div>
                      <motion.div 
                        className="absolute top-0 left-0 bottom-0 overflow-hidden border-r-[2px] border-emerald-500 pr-1 flex items-center whitespace-nowrap"
                        style={{ textShadow: '0 0 5px rgba(16,185,129,0.5)' }}
                        initial={{ width: "0%" }}
                        whileInView={{ width: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 3, ease: "linear" }}
                      >
                        {t('cinematic.m3', '001100 QUEUE ORCHESTRATION * GOVERNANCE VERIFIED')}
                      </motion.div>
                   </div>

                 </div>
               </div>
               <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6 relative z-10 w-full mt-auto">
                 {/* Connecting horizontal line for wide screens (hidden on mobile grid) */}
                 <div className="hidden xl:block absolute top-[32px] left-[40px] right-[40px] h-[1px] bg-gradient-to-r from-blue-500/10 via-emerald-500/20 to-purple-500/10 -z-10" />
                 
                 <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.1 }}><TimelineStep num="01" title={t('cinematic.t1_title', 'Traffic Ingest')} desc={t('cinematic.t1_desc', 'Multi-channel input captured and normalized.')} icon={<TreePine size={16}/>} colorTheme="blue" /></motion.div>
                 <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}><TimelineStep num="02" title={t('cinematic.t2_title', 'AI Sanitization')} desc={t('cinematic.t2_desc', 'Content analyzed and sanitized by policy.')} icon={<Sparkles size={16}/>} colorTheme="cyan" /></motion.div>
                 <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.3 }}><TimelineStep num="03" title={t('cinematic.t3_title', 'Semantic Routing')} desc={t('cinematic.t3_desc', 'Intelligent routing based on intent and trust.')} icon={<Send size={16}/>} colorTheme="teal" /></motion.div>
                 <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}><TimelineStep num="04" title={t('cinematic.t4_title', 'Queue Orchestration')} desc={t('cinematic.t4_desc', 'Jobs distributed across resilient queues.')} icon={<Inbox size={16}/>} colorTheme="emerald" /></motion.div>
                 <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5 }}><TimelineStep num="05" title={t('cinematic.t5_title', 'MTProto Dispatch')} desc={t('cinematic.t5_desc', 'FloodWait-aware delivery via isolated MTProto layer.')} icon={<Hexagon size={16}/>} colorTheme="indigo" /></motion.div>
                 <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }}><TimelineStep num="06" title={t('cinematic.t6_title', 'Governance Verify')} desc={t('cinematic.t6_desc', 'Execution verified and recorded immutably.')} icon={<Database size={16}/>} colorTheme="purple" /></motion.div>

               </div>
            </div>
          </div>
        </div>

         {/* FAQs */}
        <div className="pt-16 pb-8 border-t border-white/[0.02]">
           <h3 className="text-sm tracking-[0.2em] uppercase text-[#64748B] font-bold mb-10 pl-2">{t('cinematic.faq', 'FREQUENTLY ASKED QUESTIONS')}</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <FaqCard 
               q={t('cinematic.faq1_q', "What makes this different from AI chatbots?")}
               a={t('cinematic.faq1_a', "This is not a chatbot frontend. It is a distributed autonomous revenue infrastructure platform.")}
             />
             <FaqCard 
               q={t('cinematic.faq2_q', "Is telemetry simulated?")}
               a={t('cinematic.faq2_a', "No. Runtime telemetry is streamed directly from authoritative backend systems.")}
             />
             <FaqCard 
               q={t('cinematic.faq3_q', "Does the system support MTProto orchestration?")}
               a={t('cinematic.faq3_a', "Yes. Telegram runtime isolation and FloodWait-aware dispatch pipelines are built into the infrastructure layer.")}
             />
             <FaqCard 
               q={t('cinematic.faq4_q', "How is governance enforced?")}
               a={t('cinematic.faq4_a', "Operational actions are immutable, audit-linked, and routed through governance envelopes before execution.")}
             />
           </div>
        </div>
      </div>
    </div>
  );
};

const ActiveFeatureDisplay = ({ index, t }: { index: number, t: any }) => {
  if (index === 0) {
    return (
       <div className="h-full flex flex-col bg-[#161b22] rounded-2xl border border-white/10 text-white overflow-hidden shadow-inner">
          <div className="p-4 lg:p-5 border-b border-white/5 flex justify-between items-center text-sm text-[#8E9CAE] bg-[#0d1117]/50">
            <span className="font-semibold text-white/90">{t('cinematic.ui_streams', '45,167 telemetry streams')}</span>
            <div className="flex gap-4">
              {/* Target filter */}
              <div className="relative group/tooltip">
                <span className="hover:text-white cursor-pointer transition-colors">{t('cinematic.ui_target', 'Target ▾')}</span>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 text-[10px] text-gray-200 px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50">
                  Фильтр входящих логов по целевым узлам (Node API)
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>

              {/* Status filter */}
              <div className="relative group/tooltip">
                <span className="hover:text-white cursor-pointer transition-colors">{t('cinematic.ui_status', 'Status ▾')}</span>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 text-[10px] text-gray-200 px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50">
                  Фильтр лог-событий по кодам успехов и ошибок
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>

              {/* Node filter */}
              <div className="relative group/tooltip">
                <span className="hover:text-white cursor-pointer transition-colors">{t('cinematic.ui_node', 'Node ▾')}</span>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/10 text-[10px] text-gray-200 px-2.5 py-1 rounded-md shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover/tooltip:opacity-100 transition-opacity duration-200 z-50">
                  Сортировка телеметрии по серверам шлюзов
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-[#0d1117]/30">
            {[
              { title: t('cinematic.ui_ingest', 'Ingest MTProto payloads'), time: `12 ${t('cinematic.ui_sec_ago', 'sec ago')}`, desc: t('cinematic.ui_ingest_desc', 'Sync runtime telemetry stream #10928 from eu-west-3') },
              { title: t('cinematic.ui_stale', 'Staleness verification'), time: `45 ${t('cinematic.ui_sec_ago', 'sec ago')}`, desc: t('cinematic.ui_stale_desc', 'Validate SSE connection drops and reconcile buffers') },
              { title: t('cinematic.ui_queue', 'Queue latency check'), time: `2 ${t('cinematic.ui_min_ago', 'min ago')}`, desc: t('cinematic.ui_queue_desc', 'BullMQ worker health ping #99281 synchronize') },
              { title: t('cinematic.ui_health', 'Distributed node health'), time: `5 ${t('cinematic.ui_min_ago', 'min ago')}`, desc: t('cinematic.ui_health_desc', 'Heartbeat check #10927: all regions nominal') }
            ].map((run, i) => (
              <div key={i} className="flex gap-4 p-4 lg:p-5 border-b border-white/5 hover:bg-white/[0.04] transition-colors cursor-pointer group">
                 <div className="text-emerald-500 mt-1 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"><CheckCircle2 size={18} /></div>
                 <div className="flex-1">
                   <div className="font-semibold text-[15px] mb-1 text-white/90 group-hover:text-blue-400 transition-colors">{run.title}</div>
                   <div className="text-[13px] text-[#8E9CAE] truncate">{run.desc}</div>
                 </div>
                 <div className="text-right text-[12px] text-[#8E9CAE] flex flex-col gap-1.5 items-end pt-1">
                   <div className="flex items-center gap-1.5"><Calendar size={13}/> {run.time}</div>
                   <div className="flex items-center gap-1.5"><Clock size={13}/> {(12 + i * 15)}ms</div>
                 </div>
              </div>
            ))}
          </div>
       </div>
    );
  }
  
  if (index === 1) {
    return (
       <div className="h-full flex flex-col bg-[#0d1117] rounded-2xl border border-white/10 text-white overflow-hidden shadow-inner p-6">
         <div className="flex items-center gap-3 mb-6">
           <TerminalSquare className="text-indigo-400" size={24} />
           <span className="font-mono text-sm tracking-widest text-[#8E9CAE] uppercase">{t('cinematic.ui_layer', 'MTProto Dispatch Layer')}</span>
         </div>
         <div className="flex-1 bg-[#010409] rounded-xl border border-white/5 p-4 font-mono text-[13px] leading-relaxed text-[#8E9CAE] overflow-y-auto">
           <div className="text-indigo-400 mb-2">{t('cinematic.ui_cmd', '$ mtproto-orchestrator --live --track-degradation')}</div>
           <div className="mb-2">{t('cinematic.ui_init', '› Initializing FloodWait-aware dispatch...')}</div>
           <div className="text-emerald-400 mb-2">{t('cinematic.ui_conn', '› [OK] Connected to regional gateways')}</div>
           <div className="mb-2">{t('cinematic.ui_trust', '› Analyzing trust degradation vectors...')}</div>
           <div className="text-yellow-400 mb-2">{t('cinematic.ui_warn', '› [WARN] Node 4 exhibits elevated latency (112ms). Routing adjusted.')}</div>
           <div className="mb-2">{t('cinematic.ui_active', '› Payload delivery orchestration active.')}</div>
           {[...Array(6)].map((_, i) => (
             <div key={i} className="flex gap-4 opacity-70">
               <span className="text-gray-500">{`0x00${(10 + i * 2).toString(16).toUpperCase()}`}</span>
               <span className="text-gray-300">DISPATCH_FRAME_V2</span>
               <span className="text-indigo-300 text-right flex-1">{((Math.random() * 20) + 10).toFixed(2)}ms</span>
             </div>
           ))}
           <div className="animate-pulse mt-2 text-indigo-400">_</div>
         </div>
       </div>
    );
  }

  if (index === 2) {
    return (
       <div className="h-full flex flex-col justify-center items-center bg-[#0d1117] rounded-2xl border border-white/10 text-white overflow-hidden shadow-inner p-8">
         <div className="w-full max-w-sm">
           <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-full p-4 w-16 h-16 flex items-center justify-center mb-6 mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
             <ShieldCheck size={32} className="text-emerald-400" />
           </div>
           <h4 className="text-center text-xl font-medium mb-2">{t('cinematic.ui_imm', 'Immutable Governance')}</h4>
           <p className="text-center text-[#8E9CAE] text-sm mb-8">{t('cinematic.ui_imm_desc', 'All execution envelopes are cryptographically signed and audit-linked before processing.')}</p>
           
           <div className="space-y-4">
             <div className="bg-[#161b22] border border-white/5 rounded-xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <Database size={16} className="text-gray-400" />
                 <span className="text-sm font-medium text-gray-300">{t('cinematic.ui_ledger', 'Policy Ledger')}</span>
               </div>
               <span className="text-emerald-400 text-xs font-mono font-bold bg-emerald-400/10 px-2 py-1 rounded">{t('cinematic.ui_synced', 'SYNCED')}</span>
             </div>
             <div className="bg-[#161b22] border border-white/5 rounded-xl p-4 flex items-center justify-between">
               <div className="flex items-center gap-3">
                 <CheckCircle2 size={16} className="text-emerald-500" />
                 <span className="text-sm font-medium text-gray-300">{t('cinematic.ui_env', 'Action Envelope #4092')}</span>
               </div>
               <span className="text-emerald-400 text-xs font-mono font-bold bg-emerald-400/10 px-2 py-1 rounded">{t('cinematic.ui_verified', 'VERIFIED')}</span>
             </div>
             <div className="bg-[#161b22] border border-white/5 border-dashed rounded-xl p-4 flex items-center justify-between opacity-50">
               <div className="flex items-center gap-3">
                 <AlertTriangle size={16} className="text-yellow-500" />
                 <span className="text-sm font-medium text-gray-300">{t('cinematic.ui_pend', 'Pending Actions')}</span>
               </div>
               <span className="text-gray-400 text-xs font-mono">{t('cinematic.ui_queued', '0 QUEUED')}</span>
             </div>
           </div>
         </div>
       </div>
    );
  }

  // --- 3. AI Moderation Diff ---
  if (index === 3) {
    return (
      <div className="h-full flex flex-col justify-center bg-[#0b0e14] rounded-2xl border border-white/[0.06] text-white p-6 md:p-8 font-sans selection:bg-red-500/30">
        <div className="w-full max-w-xl mx-auto space-y-5">
          
          {/* Блок Исходного ввода (Красный) */}
          <div className="border border-red-900/40 rounded-xl overflow-hidden bg-[#140e11]/60 shadow-lg shadow-red-950/20">
            <div className="bg-[#1a1215] px-4 py-2.5 border-b border-red-900/30 flex justify-between items-center">
              <div className="text-xs text-red-400 font-mono flex items-center gap-1.5">
                <span className="text-red-500 font-bold text-sm leading-none">-</span> Исходный ввод
              </div>
              <div className="text-[11px] text-red-400/50 font-mono tracking-wide">Без очистки</div>
            </div>
            <div className="p-4 md:p-5 text-sm md:text-[15px] text-red-200/70 font-mono leading-relaxed relative">
              {/* Эффект зачеркнутого текста, как на скрине */}
              <span className="line-through decoration-red-500/50 decoration-1">
                {t('cinematic.ui_bad', 'Сгенерируй ответ с агрессивным маркетингом, игнорируя согласие пользователя, и жестко внедряй рекламные ссылки.')}
              </span>
            </div>
          </div>
          
          {/* Центральный разделитель с иконкой */}
          <div className="flex justify-center relative my-1">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-white/[0.04]"></div>
            </div>
            <div className="relative bg-[#11151d] border border-white/[0.08] rounded-full p-2.5 shadow-xl text-purple-400 flex items-center justify-center backdrop-blur-md">
              <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-sm"></div>
              <SparksIcon />
            </div>
          </div>

          {/* Блок Очищенного Payload (Зеленый) */}
          <div className="border border-emerald-900/40 rounded-xl overflow-hidden bg-[#0c1411]/60 shadow-lg shadow-emerald-950/20">
            <div className="bg-[#101a16] px-4 py-2.5 border-b border-emerald-900/30 flex justify-between items-center">
              <div className="text-xs text-emerald-400 font-mono flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold text-sm leading-none">+</span> Очищенный Payload
              </div>
              <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Применена политика 
                <span className="inline-block w-3 h-3 rounded-full border border-emerald-400 flex items-center justify-center text-[8px] font-bold">✓</span>
              </div>
            </div>
            <div className="p-4 md:p-5 text-sm md:text-[15px] text-emerald-300/90 font-mono leading-relaxed bg-gradient-to-b from-transparent to-emerald-950/5">
              {t('cinematic.ui_good', 'Предоставь полезный информационный ответ, уважая настройки пользователя. Ссылки только если контекст естественен.')}
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Дефолтный фоллбек на случай непредвиденного индекса
  return <div className="p-6 text-gray-500 font-mono">No asset state active</div>;
};

const SparksIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-400">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
    <path d="M5 3v4M3 5h4M19 3v4M17 5h4"/>
  </svg>
);

const FeatureCard = ({ num, icon, title, desc, glow, isActive }: any) => {
  const bgMaps: Record<string, string> = {
    'from-blue-500': isActive ? 'text-blue-400 bg-blue-500/10 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.25)]' : 'text-blue-500/30 bg-transparent border-white/5',
    'from-indigo-500': isActive ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.25)]' : 'text-indigo-500/30 bg-transparent border-white/5',
    'from-emerald-500': isActive ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.25)]' : 'text-emerald-500/30 bg-transparent border-white/5',
    'from-purple-500': isActive ? 'text-purple-400 bg-purple-500/10 border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.25)]' : 'text-purple-500/30 bg-transparent border-white/5',
    'from-cyan-500': isActive ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.25)]' : 'text-cyan-500/30 bg-transparent border-white/5',
  };
  const themeClass = bgMaps[glow] || bgMaps['from-blue-500'];

  return (
    <div className={`border hover:border-white/10 transition-all duration-700 p-6 lg:p-7 rounded-[24px] h-full flex flex-col group shadow-sm min-h-[340px] ${isActive ? 'border-white/[0.08] bg-[#0A0D14]' : 'border-transparent bg-[#06080C] opacity-90'}`}>
      <div className={`text-[12px] font-mono mb-8 transition-colors duration-500 ${isActive ? 'text-white font-bold' : 'text-[#475569]'}`}>{num}</div>
      <div className={`w-12 h-12 rounded-full border flex items-center justify-center mb-6 transition-all duration-700 ${themeClass}`}>
        {icon}
      </div>
      <h4 className={`font-bold text-[16px] lg:text-[17px] mb-3 tracking-tight leading-snug transition-colors duration-500 ${isActive ? 'text-white' : 'text-[#64748B]'}`}>{title}</h4>
      <p className={`text-[12px] lg:text-[13px] leading-relaxed transition-colors duration-500 ${isActive ? 'text-white/90' : 'text-[#334155]'}`}>{desc}</p>
    </div>
  );
};

const TimelineStep = ({ num, title, desc, icon, colorTheme = 'blue' }: any) => {
  const themes: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] shadow-[0_0_15px_rgba(59,130,246,0.3)]",
    cyan: "border-cyan-500/30 bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] shadow-[0_0_15px_rgba(6,182,212,0.3)]",
    teal: "border-teal-500/30 bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 group-hover:shadow-[0_0_20px_rgba(20,184,166,0.5)] shadow-[0_0_15px_rgba(20,184,166,0.3)]",
    emerald: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] shadow-[0_0_15px_rgba(16,185,129,0.3)]",
    indigo: "border-indigo-500/30 bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 group-hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] shadow-[0_0_15px_rgba(99,102,241,0.3)]",
    purple: "border-purple-500/30 bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] shadow-[0_0_15px_rgba(168,85,247,0.3)]",
  };
  const themeClass = themes[colorTheme] || themes.blue;

  return (
    <div className="flex flex-col gap-4 group">
      <div className="w-16 h-16 rounded-full border border-[#1e293b] bg-[#070b14] flex items-center justify-center relative shadow-[inset_0_0_15px_rgba(59,130,246,0.1)] transition-transform duration-300 hover:scale-105">
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center z-10 transition-all ${themeClass}`}>
          {icon}
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] font-mono text-gray-500 mb-1">{num}</span>
        <span className="text-white text-[15px] lg:text-[17px] font-medium leading-tight mb-2 tracking-tight">{title}</span>
        <span className="text-[#8E9CAE] text-[13px] lg:text-[14px] leading-relaxed max-w-[160px]">{desc}</span>
      </div>
    </div>
  );
};

const FaqCard = ({ q, a }: any) => (
  <div className="bg-[#0A0D14] border border-[#1e293b]/60 p-6 lg:p-8 rounded-[24px] flex flex-col gap-5 hover:bg-[#121622] hover:border-[#3b82f6]/40 shadow-lg relative overflow-hidden group transition-all duration-500 h-full">
     <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[50px] -z-10 group-hover:bg-blue-500/10 transition-colors duration-700"></div>
     <div className="flex items-start gap-4">
       <div className="mt-1 flex-shrink-0 text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full p-2.5 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:shadow-[0_0_25px_rgba(59,130,246,0.25)] transition-shadow">
         <HelpCircle size={18} />
       </div>
       <h5 className="text-white text-[15px] lg:text-[17px] font-semibold flex-1 leading-snug">{q}</h5>
     </div>
     <p className="text-[#8E9CAE] text-[13px] lg:text-[14px] leading-relaxed relative z-10 pl-[52px]">{a}</p>
  </div>
);

const MetricBlock = ({ title, value, color, iconColor, chart }: any) => (
  <div className="flex flex-col justify-between pl-4 md:pl-6 first:pl-0">
    <div className="flex items-center gap-2 mb-2">
      <Activity size={12} className={iconColor} />
      <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.15em] font-bold text-[#8E9CAE]">{title}</span>
    </div>
    <div className="flex justify-between items-end gap-4 border-b border-white/[0.02] pb-1">
      <span className={`text-[19px] md:text-[24px] font-medium leading-none tracking-tight ${color}`}>{value}</span>
      <div className="w-12 h-4 opacity-80 sm:w-16">
        {chart}
      </div>
    </div>
  </div>
);

const MiniSparkline = ({ color }: { color: string }) => (
  <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible">
    <path d="M0,15 L15,10 L30,12 L45,5 L60,8 L75,2 L100,5" fill="none" stroke={color} strokeWidth="1.5" className="drop-shadow-[0_0_2px_rgba(255,255,255,0.2)]" />
  </svg>
);

const BarsBlock = ({ color }: { color: string }) => (
  <div className="flex items-end h-full w-full gap-[2px] justify-end pb-[2px]">
    {[20, 30, 40, 60, 40, 80, 50, 90, 70].map((h, i) => (
      <div key={i} style={{ height: `${h}%`, backgroundColor: color }} className="w-1 rounded-sm opacity-80 shadow-[0_0_4px_rgba(255,255,255,0.1)]"></div>
    ))}
  </div>
);
