import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const HeroSection = memo(() => {
  const { t } = useTranslation();

  return (
    <motion.div 
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-6 pr-4 z-10 relative pt-10"
    >
      <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-[1.05] text-white flex flex-col gap-1 sm:gap-2">
        <span>{t('hero.title1', 'Autonomous')}</span>
        <span>{t('hero.title2', 'Revenue')}</span>
        <span>{t('hero.title3', 'Infrastructure')}</span>
      </h1>
      
      <div className="flex flex-col text-sm sm:text-base md:text-lg text-gray-300 leading-snug tracking-wide font-medium space-y-1">
        <span>{t('hero.sub1', 'Verified telemetry.')}</span>
        <span>{t('hero.sub2', 'Distributed routing.')}</span>
        <span>{t('hero.sub3', 'Governed AI execution.')}</span>
        <span>{t('hero.sub4', 'Enterprise-grade MTProto orchestration.')}</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pt-4">
        <button 
          onClick={() => {
            const tgUsername = (import.meta as any).env?.VITE_TELEGRAM_BOT_USERNAME || 'telesync_bot';
            const tgLink = tgUsername.startsWith('http') ? tgUsername : `https://t.me/${tgUsername.replace('@', '')}`;
            window.open(tgLink, '_blank', 'noopener,noreferrer');
          }}
          className="relative group flex items-center justify-center gap-3 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-[12px] font-medium text-base transition-colors shadow-[0_0_40px_rgba(37,99,235,0.3)] w-full sm:w-auto cursor-pointer"
        >
          {t('hero.cta1', 'Request Access')} <ArrowRight size={18} />
        </button>

        <Link 
          to="/app"
          className="flex items-center justify-center px-8 py-3.5 bg-transparent border border-white/20 text-gray-300 rounded-[12px] font-medium hover:border-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 w-full sm:w-auto text-center"
        >
          {t('hero.cta2', 'Open Runtime Demo')}
        </Link>
      </div>

      <div className="pt-10 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-gray-500 font-bold">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
          {t('hero.live_status', 'Live System Status')}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end gap-x-8 gap-y-4">
           <div>
             <div className="text-gray-300 text-sm font-medium flex items-center gap-2 mb-1">
               <div className="w-2 h-2 bg-emerald-500 rounded-full"></div> {t('hero.operational', 'All systems operational')}
             </div>
             <div className="text-gray-400 text-xs flex items-center gap-2">
               <div className="w-2 h-2 bg-transparent rounded-full"></div> {t('hero.uptime', 'Uptime 99.97%')}
             </div>
           </div>
           
           <svg viewBox="0 0 100 20" className="w-32 h-6 overflow-visible opacity-80">
              <path d="M0,15 L10,12 L20,14 L30,5 L40,8 L50,2 L60,10 L70,8 L80,12 L90,4 L100,5" fill="none" stroke="#10b981" strokeWidth="1.5" className="drop-shadow-[0_0_5px_rgba(16,185,129,1)]" strokeLinecap="round" strokeLinejoin="round" />
           </svg>
        </div>
      </div>
    </motion.div>
  );
});

HeroSection.displayName = 'HeroSection';
