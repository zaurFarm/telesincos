import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

export const FAQSection = memo(() => {
  const { t } = useTranslation();

  return (
    <div className="mt-12 max-w-4xl mx-auto pb-12">
      <div className="text-center mb-8">
        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight text-white mb-4 drop-shadow-md">{t('landing.seo.faq_title')}</h2>
        <div className="w-20 h-1 bg-gradient-to-r from-purple-500 to-emerald-500 mx-auto rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
      </div>
      
      <div className="space-y-6">
        {[1, 2, 3].map((faq) => (
          <div key={faq} className="bg-[#0b1120] rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors shadow-lg">
            <h3 className="text-lg font-bold flex items-center gap-3 mb-2 text-gray-100">
              <div className="w-6 h-6 rounded bg-[#1e293b] flex items-center justify-center text-xs font-mono font-bold text-[#94A3B8] shadow-inner font-black">Q</div>
              {t(`landing.seo.faq_${faq}_q`)}
            </h3>
            <p className="text-[#8E9CAE] text-sm ml-9 leading-relaxed">
               {t(`landing.seo.faq_${faq}_a`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
});

FAQSection.displayName = 'FAQSection';
