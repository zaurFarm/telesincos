import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { LanguageSelector } from './LanguageSelector';

export const Navbar = memo(({ onOpenModal }: { onOpenModal?: (tab: string) => void }) => {
  const { t, i18n } = useTranslation();

  const handleLinkClick = (e: React.MouseEvent, tab: string) => {
    if (onOpenModal) {
      e.preventDefault();
      onOpenModal(tab);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      <div className="absolute inset-0 bg-[#020617]/70 backdrop-blur-xl border-b border-white/[0.08]"></div>
      
      <div className="flex items-center justify-between px-3 sm:px-6 py-4 mx-auto max-w-screen-2xl relative">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500 z-10">
               <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M12 12L12 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-white text-xl font-medium tracking-tight">
              TeleSync OS
            </span>
            <span className="text-gray-500 font-mono text-[9px] tracking-[0.15em] uppercase">
              {t('nav.tagline') || 'Autonomous Revenue Infrastructure'}
            </span>
          </div>
        </div>
        
        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8 text-[11px] font-medium tracking-wide text-gray-300">
          <a href="#product" onClick={(e) => handleLinkClick(e, 'product')} className="hover:text-white cursor-pointer transition-colors text-xs tracking-wider font-semibold">{t('nav.product', 'Product')}</a>
          <a href="#features" onClick={(e) => handleLinkClick(e, 'features')} className="hover:text-white cursor-pointer transition-colors text-xs tracking-wider font-semibold">{t('nav.features', 'Features')}</a>
          <a href="#technology" onClick={(e) => handleLinkClick(e, 'technology')} className="hover:text-white cursor-pointer transition-colors text-xs tracking-wider font-semibold">{t('nav.technology', 'Technology')}</a>
          <a href="#security" onClick={(e) => handleLinkClick(e, 'security')} className="hover:text-white cursor-pointer transition-colors text-xs tracking-wider font-semibold">{t('nav.security', 'Security')}</a>
          <a href="#pricing" onClick={(e) => handleLinkClick(e, 'pricing')} className="hover:text-white cursor-pointer transition-colors text-xs tracking-wider font-semibold">{t('nav.pricing', 'Pricing')}</a>
          <a href="#docs" onClick={(e) => handleLinkClick(e, 'docs')} className="hover:text-white cursor-pointer transition-colors text-xs tracking-wider font-semibold">{t('nav.docs', 'Docs')}</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSelector 
            language={i18n.resolvedLanguage || (i18n.language ? i18n.language.split('-')[0] : 'en')} 
            onLanguageChange={(lang) => i18n.changeLanguage(lang)} 
          />
          <Link
            to="/app"
            id="nav-signin-btn"
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium text-[11px] uppercase tracking-wider transition-all duration-200 shadow-[0_4px_12px_rgba(37,99,235,0.25)] hover:shadow-[0_4px_20px_rgba(37,99,235,0.45)] hover:-translate-y-0.5"
          >
            {t('nav.signin', 'Sign In')}
          </Link>
        </div>
      </div>
    </nav>
  );
});

Navbar.displayName = 'Navbar';
