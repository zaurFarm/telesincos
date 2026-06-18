import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

export const HowItWorks = memo(() => {
  const { t } = useTranslation();

  return (
    <div className="mt-32">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono tracking-widest text-[#a8b1c4] uppercase shadow-sm mb-6">
          <span className="w-1.5 h-1.5 rounded bg-emerald-400 rotate-45"></span>
          How it Works
        </div>
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-md">From data to deals in 3 intelligent steps</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mt-20">
         <div className="hidden md:block absolute top-[28%] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent z-0"></div>
         
         {[1, 2, 3].map((step) => (
            <div key={step} className="relative z-10 flex flex-col items-center text-center">
               <div className="w-16 h-16 rounded-2xl bg-[#0b1120] border border-white/10 shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center text-xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-purple-400 mb-6 font-mono rotate-3 hover:rotate-0 transition-transform">
                 0{step}
               </div>
               <h3 className="text-xl font-bold mb-3 text-gray-100">{t(`landing.seo.step_${step}_title`)}</h3>
               <p className="text-[#8E9CAE] leading-relaxed text-sm px-4">
                 {t(`landing.seo.step_${step}_desc`)}
               </p>
            </div>
         ))}
      </div>
    </div>
  );
});

HowItWorks.displayName = 'HowItWorks';
