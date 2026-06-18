import React, { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BrainCircuit, MessageSquare, ShieldCheck, BarChart, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  country?: string;
}

const LiveMarginChart = ({ country }: { country?: string }) => {
  const [deal, setDeal] = useState({ size: 0, discount: 0, margin: 30, baseMargin: 30, status: 'idle' });

  const getCurrency = () => {
    if (country === 'Russia') return 'руб';
    if (country === 'Germany' || country === 'Spain') return '€';
    if (country === 'United Kingdom') return '£';
    return '$';
  };
  const currency = getCurrency();

  useEffect(() => {
    // animate a single deal flowing through
    const runDeal = () => {
       const dealSize = Math.floor(Math.random() * 1900) + 100; // 100 - 2000
       const requestedDiscount = Math.floor(Math.random() * 20) + 5; // 5-25%
       const baseMargin = Math.floor(Math.random() * 10) + 25; // 25-35% 
       const projectedMargin = baseMargin - requestedDiscount;
       
       setDeal({ size: dealSize, discount: requestedDiscount, baseMargin, margin: baseMargin, status: 'evaluating' });
       
       setTimeout(() => {
          setDeal(prev => ({ ...prev, margin: projectedMargin, status: 'calculating' }));
       }, 800);
       
       setTimeout(() => {
          setDeal(prev => ({ ...prev, status: projectedMargin < 15 ? 'blocked' : 'approved' }));
       }, 1600);
    };

    runDeal();
    const int = setInterval(runDeal, 3500);
    return () => clearInterval(int);
  }, []);

  const displaySize = currency === 'руб' ? `${deal.size} ${currency}` : `${currency}${deal.size}`;

  return (
    <div className="w-full flex-1 flex flex-col font-mono mt-6 md:mt-8 relative z-10 h-full justify-between">
       <div className="flex justify-between text-[11px] mb-4">
          <div className="text-gray-400 tracking-wider flex items-center gap-2">
            <span>СДЕЛКА</span>
            <span className="bg-white/10 px-1.5 py-0.5 rounded text-white">{displaySize}</span>
          </div>
          <div className={`font-bold tracking-widest ${deal.status === 'blocked' ? 'text-red-400' : deal.status === 'approved' ? 'text-emerald-400' : 'text-blue-400 animate-pulse'}`}>
            {deal.status === 'evaluating' ? 'АНАЛИЗ...' : deal.status === 'calculating' ? 'СИМУЛЯЦИЯ...' : deal.status === 'blocked' ? 'К МЕНЕДЖЕРУ' : 'АВТО-ОДОБРЕНО'}
          </div>
       </div>
       
       <div className="grid grid-cols-2 gap-3 pb-1 flex-1">
          <div className="bg-black/40 rounded-xl p-4 border border-white/5 flex flex-col justify-center">
             <div className="text-[10px] text-gray-500 mb-2 tracking-widest uppercase">Запрос скидки</div>
             <div className="text-3xl font-bold text-white tracking-tight">{deal.status === 'evaluating' ? '--' : `${deal.discount}%`}</div>
          </div>
          
          <div className={`rounded-xl p-4 border transition-colors duration-500 flex flex-col justify-center relative overflow-hidden ${
             deal.status === 'idle' || deal.status === 'evaluating' ? 'bg-black/40 border-white/5' :
             deal.margin < 15 ? 'bg-red-500/10 border-red-500/30 shadow-[inset_0_0_20px_rgba(239,68,68,0.1)]' : 'bg-emerald-500/10 border-emerald-500/30'
          }`}>
             <div className="text-[10px] text-gray-500 mb-2 tracking-widest uppercase relative z-10">Прогноз маржи</div>
             <div className="flex items-end gap-2 relative z-10">
               <div className={`text-3xl font-bold tracking-tight transition-colors duration-500 ${
                 deal.status === 'idle' || deal.status === 'evaluating' ? 'text-white' :
                 deal.margin < 15 ? 'text-red-400' : 'text-emerald-400'
               }`}>
                 {deal.status === 'evaluating' ? `${deal.baseMargin}%` : `${deal.margin}%`}
               </div>
               <div className="text-[10px] mb-1.5 opacity-50 font-sans tracking-tight">
                 (Мин 15%)
               </div>
             </div>
             {deal.status === 'blocked' && (
                <div className="absolute inset-0 bg-red-500/20 animate-pulse"></div>
             )}
          </div>
       </div>
    </div>
  );
};

const MemoryVisualization = () => {
  return (
    <div className="absolute top-1/2 right-6 -translate-y-1/2 flex items-center justify-center opacity-30 pointer-events-none w-32 h-32 invisible md:visible">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="w-full h-full border border-blue-500/30 rounded-full absolute border-dashed"
      />
      <motion.div 
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="w-24 h-24 border border-indigo-500/40 rounded-full absolute"
      />
      <motion.div 
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="w-16 h-16 bg-blue-500/10 rounded-full absolute blur-sm"
      />
      {['top', 'bottom', 'left', 'right'].map((pos, i) => (
        <motion.div
           key={pos}
           initial={{ opacity: 0, scale: 0 }}
           animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 1.5] }}
           transition={{ duration: 2, delay: i * 0.5, repeat: Infinity }}
           className={`absolute w-2 h-2 bg-blue-400 rounded-full shadow-[0_0_10px_#60a5fa] ${
             pos === 'top' ? 'top-0' : pos === 'bottom' ? 'bottom-0' : pos === 'left' ? 'left-0' : 'right-0'
           }`}
        />
      ))}
    </div>
  );
};

const AutopilotVisualization = () => {
  return (
    <div className="absolute right-0 bottom-0 top-0 w-1/2 overflow-hidden pointer-events-none opacity-20 invisible md:visible">
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 w-32 pt-6">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: i * 0.2, repeat: Infinity, repeatDelay: 2 }}
            className="w-full h-1.5 bg-orange-500/40 rounded-full relative overflow-hidden"
          >
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1, delay: i * 0.2 + 0.5, repeat: Infinity, repeatDelay: 1.5 }}
              className="absolute inset-y-0 w-1/3 bg-orange-400"
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const NegotiationVisualization = () => {
  return (
    <div className="absolute -inset-4 pointer-events-none opacity-[0.03] invisible md:visible flex flex-col items-center justify-center font-mono text-[8px] whitespace-pre text-purple-300">
       <motion.div
         animate={{ y: [0, -100] }}
         transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
       >
{`[SYS] Контекст загружен.
[SYS] Инициализация NLP...
[ACT] Распознан интент: запрос_скидки
[EVAL] Тональность: нейтральная
[DEC] Решение: удержать_цену
[SYS] Контекст загружен.
[SYS] Инициализация NLP...
[ACT] Распознан интент: запрос_скидки
[EVAL] Тональность: нейтральная
[DEC] Решение: удержать_цену`}
       </motion.div>
    </div>
  );
};

export const FeatureGrid = memo(({ country }: Props) => {
  const { t } = useTranslation();

  const features = [
    {
      icon: <BrainCircuit size={20} className="text-purple-400" />,
      color: 'from-purple-500/20 to-transparent',
      borderColor: 'border-t-purple-500/30',
      title: 'Memory of Every Lead',
      desc: 'Remembers preferences, history, and context across every channel and conversation.'
    },
    {
      icon: <MessageSquare size={20} className="text-blue-400" />,
      color: 'from-blue-500/20 to-transparent',
      borderColor: 'border-t-blue-500/30',
      title: 'Negotiation Logic',
      desc: 'Adapts tone, timing, and messaging style to maximize reply rate and conversion.'
    },
    {
      icon: <ShieldCheck size={20} className="text-emerald-400" />,
      color: 'from-emerald-500/20 to-transparent',
      borderColor: 'border-t-emerald-500/30',
      title: 'Risk Control',
      desc: 'Real-time risk scoring, fraud detection and margin protection built-in.'
    },
    {
      icon: <BarChart size={20} className="text-indigo-400" />,
      color: 'from-indigo-500/20 to-transparent',
      borderColor: 'border-t-indigo-500/30',
      title: 'Advanced Analytics',
      desc: 'Cross-channel dashboards with attribution, LTV, CAC and funnel intelligence.'
    },
    {
      icon: <Zap size={20} className="text-orange-400" />,
      color: 'from-orange-500/20 to-transparent',
      borderColor: 'border-t-orange-500/30',
      title: 'Autopilot Sales',
      desc: 'Handles up to 80% of manager workload with fully autonomous workflows.'
    }
  ];

  return (
    <div className="mt-16 md:mt-24">
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]"
      >
        
        {/* Large Main Capability */}
        <motion.div 
          whileHover={{ y: -8, transition: { duration: 0.4, ease: "easeOut" } }}
          className="md:col-span-7 md:row-span-2 flex flex-col group relative bg-[#090b14]/70 backdrop-blur-2xl rounded-[32px] md:rounded-[40px_100px_40px_40px] p-6 md:p-10 transition-all duration-700 cursor-pointer overflow-hidden z-10"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.25), 0 20px 80px rgba(0,0,0,0.45), 0 0 120px rgba(99,102,241,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Inner Light Inset */}
          <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'linear-gradient(to bottom right, rgba(255,255,255,0.12), transparent)', zIndex: 0, maskImage: 'linear-gradient(black, black)', maskComposite: 'exclude' }}></div>
          
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0"></div>
          <motion.div 
            animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }} 
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-32 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full z-0"
          ></motion.div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-[1rem] md:rounded-[1.5rem] bg-[#020617] border border-white/10 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-500 relative overflow-hidden">
              <div className="absolute inset-0 bg-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <ShieldCheck size={28} className="text-indigo-400 group-hover:text-indigo-300 drop-shadow-[0_0_15px_currentColor] relative z-10" />
            </div>
            <div className="flex gap-2 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mt-0.5 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Активна</span>
            </div>
          </div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 items-stretch">
             <div className="pb-4 flex flex-col justify-center">
               <h3 className="text-2xl md:text-3xl font-bold text-white mb-3 md:mb-5 tracking-tight drop-shadow-sm">{t('landing.features.approval', 'Контроль риска')}</h3>
               <p className="text-[#8E9CAE] text-sm md:text-base leading-relaxed font-medium">
                 {t('landing.features.approval_desc', 'Рискованные сделки и скидки подтверждает оператор. Маржа всегда защищена на уровне системы.')}
               </p>
             </div>
             <div className="bg-[#020617]/50 rounded-2xl border border-white/5 p-5 md:p-6 flex flex-col justify-end overflow-hidden relative min-h-[180px] w-full shadow-inner group/chart">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover/chart:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-5 left-5 md:top-6 md:left-6 text-[10px] text-[#64748B] font-mono tracking-widest uppercase">Защита маржи</div>
                <LiveMarginChart country={country} />
             </div>
          </div>
        </motion.div>

        {/* Tall Wide Capability */}
        <motion.div 
          whileHover={{ y: -8, transition: { duration: 0.4, ease: "easeOut" } }}
          className="md:col-span-5 md:row-span-1 flex flex-col group relative bg-[#090b14]/70 backdrop-blur-2xl rounded-[24px] md:rounded-[40px_40px_100px_40px] p-6 md:p-8 transition-all duration-700 cursor-pointer overflow-hidden z-10"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.25), 0 20px 80px rgba(0,0,0,0.45), 0 0 100px rgba(59,130,246,0.08)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Inner Light Inset */}
          <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'linear-gradient(to bottom right, rgba(255,255,255,0.12), transparent)', zIndex: 0, maskImage: 'linear-gradient(black, black)', maskComposite: 'exclude' }}></div>

          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0"></div>
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-blue-500/20 blur-[60px] rounded-full group-hover:bg-blue-400/30 transition-colors duration-700 z-0"></div>
          
          <MemoryVisualization />
          
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-[1rem] bg-[#020617] border border-white/10 flex items-center justify-center transition-transform duration-700 shrink-0 shadow-inner relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <BrainCircuit size={24} className="text-blue-400 drop-shadow-[0_0_10px_currentColor] animate-[pulse_3s_ease-in-out_infinite] group-hover:scale-110 transition-transform duration-700 relative z-10" />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight drop-shadow-sm">{t('landing.features.memory', 'Память клиентов')}</h3>
          </div>
          
          <p className="text-[#8E9CAE] text-[15px] leading-relaxed flex-1 relative z-10 font-medium">
            {t('landing.features.memory_desc', 'Помнит предпочтения и историю диалогов, контекст звонков и email переписки.')}
          </p>
        </motion.div>

        {/* Small Capability 1 */}
        <motion.div 
          whileHover={{ y: -8, transition: { duration: 0.4, ease: "easeOut" } }}
          className="md:col-span-3 md:row-span-1 flex flex-col group relative bg-[#090b14]/70 backdrop-blur-2xl rounded-[24px] md:rounded-[40px] p-6 md:p-8 transition-all duration-700 cursor-pointer overflow-hidden z-10"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.25), 0 20px 80px rgba(0,0,0,0.45), 0 0 80px rgba(249,115,22,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'linear-gradient(to bottom right, rgba(255,255,255,0.12), transparent)', zIndex: 0, maskImage: 'linear-gradient(black, black)', maskComposite: 'exclude' }}></div>
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0"></div>
          
          <AutopilotVisualization />
          
          <div className="w-12 h-12 rounded-[1rem] bg-[#020617] border border-white/10 flex items-center justify-center mb-5 shrink-0 shadow-inner relative overflow-hidden group-hover:border-orange-500/30 transition-colors duration-500">
             <Zap size={24} className="text-orange-400 group-hover:scale-110 transition-transform duration-500 drop-shadow-[0_0_15px_currentColor]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3 tracking-tight relative z-10">{t('landing.features.seo_title_3', 'Автопилот продаж')}</h3>
          <p className="text-[#8E9CAE] text-[14px] leading-relaxed font-medium line-clamp-3 relative z-10">{t('landing.features.seo_desc_3', 'Снижает нагрузку на менеджеров, беря на себя рутину.')}</p>
        </motion.div>

        {/* Small Capability 2 */}
        <motion.div 
          whileHover={{ y: -8, transition: { duration: 0.4, ease: "easeOut" } }}
          className="md:col-span-2 md:row-span-1 flex flex-col group relative bg-[#090b14]/70 backdrop-blur-2xl text-center items-center justify-center rounded-[24px] md:rounded-[40px_40px_40px_100px] p-6 md:p-8 transition-all duration-700 cursor-pointer overflow-hidden z-10"
          style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.25), 0 20px 80px rgba(0,0,0,0.45), 0 0 80px rgba(168,85,247,0.05)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{ background: 'linear-gradient(to bottom right, rgba(255,255,255,0.12), transparent)', zIndex: 0, maskImage: 'linear-gradient(black, black)', maskComposite: 'exclude' }}></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0"></div>
          
          <NegotiationVisualization />
          
          <div className="w-14 h-14 rounded-full bg-[#020617] border border-white/10 flex items-center justify-center mb-4 shrink-0 shadow-inner relative overflow-hidden group-hover:border-purple-500/30 transition-colors duration-500">
             <MessageSquare size={28} className="text-purple-400 drop-shadow-[0_0_15px_currentColor] group-hover:scale-110 transition-transform duration-500" />
          </div>
          <div className="text-[15px] font-bold text-white leading-tight tracking-tight mt-1 relative z-10">{t('landing.features.negotiation', 'Логика переговоров')}</div>
        </motion.div>

      </motion.div>

      <div className="mt-32 border-t border-b border-white/5 bg-white/[0.01] py-12 flex flex-col items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent"></div>
        <div className="text-[10px] font-bold tracking-[0.2em] text-[#64748B] uppercase mb-8 z-10">{t('landing.trusted_by', 'КОРПОРАТИВНЫЙ СТАНДАРТ. ДОВЕРЯЮТ ЛИДЕРЫ.')}</div>
        <div className="flex flex-wrap items-center justify-center gap-12 lg:gap-20 opacity-40 grayscale hover:grayscale-0 transition-all duration-700 z-10">
          <div className="flex items-center gap-2 font-black text-xl tracking-tighter"><div className="w-6 h-6 rounded bg-indigo-500"></div> stripe</div>
          <div className="flex items-center gap-2 font-bold text-xl"><div className="w-6 h-6 rounded bg-green-500"></div> shopify</div>
          <div className="flex items-center gap-2 font-sans font-bold text-xl"><div className="w-6 h-6 rounded-full border-[6px] border-black border-t-white bg-transparent"></div> OpenAI</div>
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight"><div className="w-6 h-6 rounded-tl-xl rounded-br-xl bg-white"></div> vercel</div>
          <div className="flex items-center gap-2 font-semibold text-xl"><div className="grid grid-cols-2 gap-0.5"><div className="w-2.5 h-2.5 bg-blue-500"></div><div className="w-2.5 h-2.5 bg-blue-500"></div><div className="w-2.5 h-2.5 bg-blue-500"></div><div className="w-2.5 h-2.5 bg-blue-500"></div></div> Microsoft</div>
        </div>
      </div>
    </div>
  );
});

FeatureGrid.displayName = 'FeatureGrid';
