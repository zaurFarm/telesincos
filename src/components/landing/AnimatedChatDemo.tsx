import React, { memo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, ShieldCheck, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// @ts-ignore
import iphoneBoxesImg from '../../assets/images/iphone_bulk_sealed_boxes_1780154357206.png';
// @ts-ignore
import airpodsBoxesImg from '../../assets/images/airpods_bulk_sealed_boxes_1780154372728.png';

export type DemoState = 'IDLE' | 'Q1' | 'A1' | 'FILE1' | 'Q2' | 'A2' | 'PIC1' | 'Q3' | 'A3' | 'Q4';
const STATE_ORDER: DemoState[] = ['IDLE', 'Q1', 'A1', 'FILE1', 'Q2', 'A2', 'PIC1', 'Q3', 'A3', 'Q4'];
const STATE_DURATIONS: Record<DemoState, number> = {
  IDLE: 1500, Q1: 2500, A1: 2000, FILE1: 2500, Q2: 3500, A2: 2500, PIC1: 3000, Q3: 3500, A3: 2500, Q4: 4000
};

export const AnimatedChatDemo = memo(() => {
  const { t, i18n } = useTranslation();
  const [demoState, setDemoState] = useState<DemoState>('IDLE');
  const demoStateRef = useRef(demoState);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const stepIndex = STATE_ORDER.indexOf(demoState);

  useEffect(() => {
    demoStateRef.current = demoState;
  }, [demoState]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [demoState]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let mounted = true;

    const scheduleNext = () => {
      if (!mounted) return;
      
      const current = demoStateRef.current;
      const duration = STATE_DURATIONS[current];

      timeoutId = setTimeout(() => {
        if (!mounted) return;
        
        // if (document.visibilityState !== 'visible') {
        //    scheduleNext();
        //    return;
        // }

        const nextIdx = (STATE_ORDER.indexOf(current) + 1) % STATE_ORDER.length;
        if (nextIdx === 0) {
           // wait longer before reset
           setTimeout(() => { if (mounted) { setDemoState('IDLE'); scheduleNext(); } }, 6000);
           return;
        }

        const nextState = STATE_ORDER[nextIdx];
        setDemoState(nextState);
        scheduleNext();

      }, duration);
    };

    scheduleNext();

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const langMatch = i18n.resolvedLanguage || (i18n.language ? i18n.language.split('-')[0] : 'en');
  const displayPrice = langMatch === 'ru'
    ? (stepIndex < 2 ? '0 ₽' : stepIndex < 4 ? '106 500 ₽' : stepIndex < 7 ? '108 500 ₽' : '1 170 000 ₽')
    : langMatch === 'en' 
      ? (stepIndex < 2 ? '$0' : stepIndex < 4 ? '$1,065' : stepIndex < 7 ? '$1,085' : '$11,700')
      : (stepIndex < 2 ? '€0' : stepIndex < 4 ? '€1,065' : stepIndex < 7 ? '€1,085' : '€11,700');

  const displayRisk = stepIndex < 4 ? '12%' : '23%';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative w-full h-auto flex flex-col items-center justify-center pt-8"
    >
       {/* Floating Shell */}
       <div 
         style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.25), 0 30px 100px rgba(0,0,0,0.6)' }}
         className="relative w-full max-w-[850px] bg-[#1a1c22]/95 border border-white/[0.05] overflow-hidden flex flex-col font-sans rounded-[32px]"
       >
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none z-0"></div>

         <div className="px-6 py-6 flex items-center justify-between border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent z-10 shrink-0">
            <div className="flex items-center gap-4">
               <div className="relative w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#8050ff] to-[#5b2bd9] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                  <BrainCircuit size={24} className="text-white" />
                  <div className="absolute inset-0 bg-purple-400 rounded-[16px] animate-ping opacity-20 duration-1000"></div>
                  <div className="absolute inset-0 -z-10 rounded-full blur-2xl bg-fuchsia-500/40"></div>
               </div>
               <div className="flex flex-col justify-center">
                 <div className="text-white font-semibold tracking-tight text-xl drop-shadow-md">Cognitive Core</div>
                 <div className="text-[#10b981] text-[11px] font-mono tracking-wide uppercase flex items-center gap-1.5 mt-0.5">
                   <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full animate-pulse shadow-[0_0_5px_currentColor]"></span>
                   АВТОНОМНЫЙ РЕЖИМ
                 </div>
               </div>
            </div>
            <div className="flex gap-1.5 items-center justify-center opacity-60">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>
            </div>
         </div>

         {/* Main Content Area */}
         <div className="p-6 flex flex-col gap-6 relative z-10 w-full">
           
           <div className="bg-[#12141c] rounded-[24px] md:rounded-full p-4 md:px-6 shadow-inner relative overflow-hidden flex flex-col gap-2 shrink-0">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-[10px] md:text-[11px] tracking-[0.1em] font-medium uppercase text-gray-400">
               <span className="tracking-[0.2em]">{t('chatdemo.demo_status')}</span>
               <div className="flex flex-wrap items-center gap-2 md:gap-3">
                 <span className="text-white flex items-center gap-1.5 font-sans tracking-normal capitalize">
                   <span className="w-2 h-2 bg-[#b89b4a] rounded-full"></span> 
                   {t('chatdemo.demo_stage')}
                   <span className="text-gray-400 ml-1">67%</span>
                 </span>
                 <span className="text-gray-500 text-xs hidden md:inline">•</span>
                 <span className="text-gray-400 flex items-center gap-1.5 font-mono lowercase text-[10px]">
                   <span className="w-1.5 h-1.5 bg-[#5962f6] rounded-full"></span> 
                   sse_conn
                 </span>
                 <span className="text-gray-400 flex items-center gap-1.5 font-mono lowercase text-[10px]">
                   <span className="w-1.5 h-1.5 bg-[#10b981] rounded-full"></span> 
                   24ms
                 </span>
               </div>
             </div>
             
             <div className="h-[6px] w-full bg-[#20232f] rounded-full overflow-hidden shrink-0 mt-1 md:mt-0">
               <motion.div 
                 className="h-full bg-gradient-to-r from-purple-500 via-indigo-400 to-[#5962f6] shadow-[0_0_15px_rgba(139,92,246,0.5)] rounded-full"
                 initial={{ width: "67%" }}
                 animate={{ width: stepIndex >= 6 ? "84%" : "67%" }}
                 transition={{ duration: 1, ease: "easeOut" }}
               />
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-[1fr_minmax(240px,240px)] gap-6 flex-1 md:min-h-[480px]">
             
             <div className="bg-[#12141c] rounded-3xl p-4 flex flex-col relative shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] overflow-hidden h-[450px] md:h-[520px]">
               <div className="flex mb-3 shrink-0 z-10 relative">
                  <div className="px-4 py-2 bg-white/[0.03] border border-white/[0.05] rounded-l-none rounded-r-3xl rounded-bl-3xl text-gray-400 text-[10px] flex flex-col items-start gap-1 w-[200px]">
                    <span className="tracking-wide uppercase font-mono">{t('chatdemo.demo_wait')}</span>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1 h-1 rounded-full bg-blue-500"></div>
                       <span className="tracking-wide uppercase font-mono">{t('chatdemo.demo_signals')}</span>
                    </div>
                    <span className="tracking-wide uppercase font-mono">{t('chatdemo.demo_signals2')}</span>
                  </div>
               </div>

               <div ref={chatContainerRef} className="flex-1 overflow-y-auto hidden-scrollbar flex flex-col gap-4 pb-8 relative z-0">
                 <AnimatePresence>
                   {stepIndex >= 1 && (
                     <motion.div 
                       key="q1"
                       initial={{ opacity: 0, y: 10, scale: 0.98 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       className="self-start max-w-[85%] px-4 py-3 bg-[#1d202b] rounded-[18px] rounded-tl-sm text-gray-200 text-sm shadow-sm"
                     >
                       {t('chatdemo.demo_q1')}
                     </motion.div>
                   )}
                   {stepIndex >= 2 && (
                     <motion.div 
                       key="a1"
                       initial={{ opacity: 0, y: 10, scale: 0.98 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       className="self-end max-w-[85%] px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-[18px] rounded-tr-sm text-indigo-50 text-sm shadow-sm"
                     >
                       {t('chatdemo.demo_a1')}
                     </motion.div>
                   )}
                   {stepIndex >= 3 && (
                     <motion.div 
                       key="f1"
                       initial={{ opacity: 0, y: 10, scale: 0.98 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       className="self-end max-w-[85%] px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-[18px] rounded-tr-sm text-indigo-50 text-sm flex items-center gap-3 shadow-sm cursor-pointer hover:bg-indigo-500/20 transition-colors"
                     >
                       <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                         <FileText size={20} />
                        </div>
                        <div className="flex flex-col">
                         <span className="font-medium">{t('chatdemo.demo_file_name')}</span>
                         <span className="text-[10px] text-gray-400">1.2 MB • PDF</span>
                       </div>
                     </motion.div>
                   )}
                   {stepIndex >= 4 && (
                     <motion.div 
                       key="q2"
                       initial={{ opacity: 0, y: 10, scale: 0.98 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       className="self-start max-w-[85%] px-4 py-3 bg-[#1d202b] rounded-[18px] rounded-tl-sm text-gray-200 text-sm shadow-sm"
                     >
                       {t('chatdemo.demo_q2')}
                     </motion.div>
                   )}
                   {stepIndex >= 5 && (
                     <motion.div 
                       key="a2"
                       initial={{ opacity: 0, y: 10, scale: 0.98 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       className="self-end max-w-[85%] px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-[18px] rounded-tr-sm text-indigo-50 text-sm shadow-sm"
                     >
                       {t('chatdemo.demo_a2')}
                     </motion.div>
                   )}
                   {stepIndex >= 6 && (
                     <motion.div 
                       key="p1"
                       initial={{ opacity: 0, y: 10, scale: 0.98 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       className="self-end max-w-[85%] px-2 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-[18px] rounded-tr-sm text-indigo-50 text-sm flex items-center gap-2 shadow-sm"
                     >
                        <div className="w-32 h-24 rounded-bl-xl rounded-tl-xl bg-slate-950 flex items-center justify-center border border-white/10 relative overflow-hidden group">
                           <img 
                             src={iphoneBoxesImg} 
                             alt="iPhones Batch Stock" 
                             className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105" 
                             referrerPolicy="no-referrer" 
                           />
                           {/* Real warehouse stock identifier tag */}
                           <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold text-emerald-400 tracking-wider uppercase border border-white/10 shadow-lg">
                             LOT #2492-IP15
                           </div>
                           <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 flex items-center justify-between text-[9px] font-sans text-gray-200">
                             <span className="truncate font-semibold text-white">iPhone 15 Pro (10x)</span>
                           </div>
                         </div>
                         <div className="w-32 h-24 rounded-br-xl rounded-tr-xl bg-slate-950 flex items-center justify-center border border-white/10 relative overflow-hidden group">
                           <img 
                             src={airpodsBoxesImg} 
                             alt="Wireless Earbuds Batch" 
                             className="absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105" 
                             referrerPolicy="no-referrer" 
                           />
                           {/* Real warehouse stock identifier tag */}
                           <div className="absolute top-1.5 left-1.5 bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold text-purple-400 tracking-wider uppercase border border-white/10 shadow-lg">
                             LOT #3115-AP2
                           </div>
                           <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5 flex items-center justify-between text-[9px] font-sans text-gray-200">
                             <span className="truncate font-semibold text-white">AirPods Pro (5x)</span>
                           </div>
                         </div>
                     </motion.div>
                   )}
                   {stepIndex >= 7 && (
                     <motion.div 
                       key="q3"
                       initial={{ opacity: 0, y: 10, scale: 0.98 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       className="self-start max-w-[85%] px-4 py-3 bg-[#1d202b] rounded-[18px] rounded-tl-sm text-gray-200 text-sm shadow-sm"
                     >
                       {t('chatdemo.demo_q3')}
                     </motion.div>
                   )}
                   {stepIndex >= 8 && (
                     <motion.div 
                       key="a3"
                       initial={{ opacity: 0, y: 10, scale: 0.98 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       className="self-end max-w-[85%] px-4 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-[18px] rounded-tr-sm text-indigo-50 text-sm shadow-sm"
                     >
                       {t('chatdemo.demo_a3')}
                     </motion.div>
                   )}
                   {stepIndex >= 9 && (
                     <motion.div 
                       key="q4"
                       initial={{ opacity: 0, y: 10, scale: 0.98 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       className="self-start max-w-[85%] px-4 py-3 bg-[#1d202b] rounded-[18px] rounded-tl-sm text-gray-200 text-sm shadow-sm"
                     >
                       {t('chatdemo.demo_q4')}
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
             </div>

             <div className="flex flex-col gap-6 h-[450px] md:h-[520px]">
                               <div className="bg-[#12141c] rounded-[24px] p-6 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] flex flex-col h-[290px] md:h-[320px] justify-between relative overflow-hidden">
                  <div className="flex justify-between items-center w-full">
                    <div className="text-[10px] font-mono tracking-[0.15em] text-gray-500 uppercase">
                      {t('chatdemo.demo_price')}
                    </div>
                    {stepIndex >= 7 && (
                      <span className="text-[9px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full uppercase animate-pulse font-bold">
                        {langMatch === 'ru' ? 'Сборная сделка' : 'Multi-Item'}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col my-3">
                    <div className="h-[40px] flex items-center overflow-hidden">
                      <motion.span 
                       className="text-4xl font-medium text-white tracking-tight block"
                       initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} key={displayPrice}
                      >
                        {displayPrice}
                      </motion.span>
                    </div>
                    <span className="text-[#10b981] text-[10px] uppercase font-mono mt-1 tracking-widest">
                      {stepIndex >= 7 ? (langMatch === 'ru' ? 'СУММА ЗАКАЗА' : 'ORDER TOTAL') : t('chatdemo.demo_optimal')}
                    </span>
                  </div>

                  {/* Detected Products Indicator */}
                  <div className="border-t border-white/5 pt-3 my-2 text-xs">
                    <span className="text-gray-500 font-mono text-[9px] uppercase tracking-wider block mb-1">
                      {langMatch === 'ru' ? 'Обнаруженные товары:' : 'Detected Products:'}
                    </span>
                    <div className="flex flex-col justify-center font-sans h-[52px] overflow-hidden">
                      {stepIndex === 0 ? (
                        <span className="text-gray-600 italic">
                          {langMatch === 'ru' ? 'Ожидание диалога...' : 'Awaiting conversation...'}
                        </span>
                      ) : stepIndex < 4 ? (
                        <div className="text-white font-medium flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                          <span>iPhone 15 Pro Max 256GB</span>
                        </div>
                      ) : stepIndex < 7 ? (
                        <div className="space-y-1">
                          <div className="text-white font-medium flex items-center gap-2.5">
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                            <span>iPhone 15 Pro Max 256GB</span>
                          </div>
                          <div className="text-gray-400 font-medium flex items-center gap-2.5 pl-3.5">
                            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></span>
                            <span>AirPods Pro 2 <span className="text-[9px] text-indigo-400">({langMatch === 'ru' ? 'интерес' : 'interest'})</span></span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="text-indigo-200 font-semibold flex items-center justify-between gap-2 border-b border-white/[0.03] pb-1">
                            <div className="flex items-center gap-2.5">
                              <span className="w-1.5 h-1.5 bg-[#8c94ff] rounded-full animate-pulse"></span>
                              <span>iPhone 15 Pro Max</span>
                            </div>
                            <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded font-mono font-bold">x10</span>
                          </div>
                          <div className="text-purple-200 font-semibold flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="w-1.5 h-1.5 bg-[#a78bfa] rounded-full animate-pulse"></span>
                              <span>AirPods Pro 2</span>
                            </div>
                            <span className="text-[10px] text-gray-400 bg-white/5 px-1.5 py-0.5 rounded font-mono font-bold">x5</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-auto pt-3 text-[11px] font-mono text-gray-400 border-t border-white/5">
                    <div className="flex justify-between items-center w-full">
                      <span>{t('chatdemo.demo_risk')}</span>
                      <span className="text-white">{displayRisk}</span>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <span>{t('chatdemo.demo_margin')}</span>
                      <span className="text-indigo-200 flex items-center justify-center gap-1 bg-[#1e2336] px-2 py-0.5 rounded text-[10px]"><ShieldCheck size={10} /> {t('chatdemo.demo_active')}</span>
                    </div>
                  </div>
                </div>

               <div className="bg-[#12141c] rounded-[24px] p-6 shadow-[inset_0_2px_15px_rgba(0,0,0,0.5)] flex flex-col flex-1">
                 <div className="text-[10px] font-mono tracking-[0.15em] text-gray-500 uppercase mb-3">
                   {t('chatdemo.demo_intent')}
                 </div>
                 <div className="flex items-center gap-3 mb-4">
                   <span className="text-3xl font-medium text-white tracking-tight">0.98</span>
                   <span className="text-[#10b981] text-[10px] uppercase font-mono tracking-widest bg-[#10b981]/10 px-1.5 py-0.5 rounded">+12.5%</span>
                 </div>
                 <div className="flex items-end gap-1.5 h-6 w-full opacity-60">
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[10%] content-none"></div>
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[10%]"></div>
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[20%]"></div>
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[15%]"></div>
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[20%]"></div>
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[35%]"></div>
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[55%]"></div>
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[40%]"></div>
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[65%]"></div>
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[80%]"></div>
                    <div className="w-full bg-[#5962f6] rounded-[2px] h-[100%]"></div>
                 </div>
               </div>
             </div>
           </div>
         </div>
       </div>
    </motion.div>
  );
});

export default AnimatedChatDemo;
