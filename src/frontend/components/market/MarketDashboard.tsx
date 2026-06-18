import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, ShieldAlert, Zap, AlertTriangle, ArrowRightCircle, Target, Activity, ArrowDown, BookOpen, ExternalLink, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';

const blogLottie = "https://assets9.lottiefiles.com/packages/lf20_tno6cg2w.json"; 
const analyticsLottie = "https://assets3.lottiefiles.com/packages/lf20_ncztkcq6.json";

// We'll just fetch these from public generic Lottie URLs or use a fallback. 
// Given strict URL limitations, we can do a quick check or just use animated shapes if Lottie fails.
// For now, I'll use simple Framer Motion animated components inside modern Bento cards.

const translations = {
  en: {
    marketIntelligence: "Market Intelligence",
    marketIntelligenceSub: "REAL-TIME PRICING & DEMAND ANALYTICS",
    marketMedian: "Market Median",
    lowestVerified: "Lowest Verified",
    demandPressure: "Demand Pressure",
    suspiciousPrices: "Suspicious Prices",
    fromLastWeek: "from last week",
    mentions: "mentions / 24h",
    fakeStock: "Likely scams / fake stock",
    cheapestVerified: "Cheapest Verified",
    aiActions: "AI Recommendations",
    aiInsightsBlog: "AI Market Blog",
    promoTitle: "Dominate the Market with Cognitive Insights",
    promoDesc: "In 2026, static pricing is dead. Our Autonomic Deal Engine constantly scans thousands of channels, comparing hidden stock and pricing signals to give you an unparalleled competitive edge. This isn't just parsing—it's market cognition.",
    blogTitle1: "Why 'HQD Cuvie Plus' Pricing is Collapsing in Berlin",
    blogDesc1: "Our real-time telemetry detected a 14% drop in median prices across German distributors. Learn how our AI safely auto-adjusted your margins to capture 4x more leads while competitors hesitated...",
    blogTitle2: "The Rise of Fake Wholesale Stock in Q3",
    blogDesc2: "We've flagged 14 new suspicious suppliers offering below-market rates. Here is the anatomical breakdown of an automated scam and how the Risk Agent filters them out of your pipeline.",
    readMore: "Read Full Report",
    applyToCrm: "Apply to CRM",
    ignore: "Ignore"
  },
  ru: {
    marketIntelligence: "Аналитика Рынка",
    marketIntelligenceSub: "АНАЛИТИКА ЦЕН И СПРОСА В РЕАЛЬНОМ ВРЕМЕНИ",
    marketMedian: "Медиана Рынка",
    lowestVerified: "Низшая Подтвержденная",
    demandPressure: "Давление Спроса",
    suspiciousPrices: "Подозрительные Цены",
    fromLastWeek: "с прошлой недели",
    mentions: "упоминаний / 24ч",
    fakeStock: "Скам / фейк-сток",
    cheapestVerified: "Выгодные Цены",
    aiActions: "Рекомендации ИИ",
    aiInsightsBlog: "Market-Блог ИИ",
    promoTitle: "Доминируйте на рынке с помощью Когнитивной Аналитики",
    promoDesc: "В 2026 году статичное ценообразование мертво. Наша система постоянно сканирует тысячи каналов, сопоставляя скрытые запасы и ценовые сигналы, чтобы дать вам беспрецедентное преимущество. Это не просто парсинг — это рыночное познание.",
    blogTitle1: "Почему цены на 'HQD Cuvie Plus' рухнули в Берлине",
    blogDesc1: "Наша телеметрия в реальном времени обнаружила падение цен на 14% у немецких дистрибьюторов. Узнайте, как наш ИИ автоматически скорректировал вашу маржу, захватив в 4 раза больше лидов, пока конкуренты ждали...",
    blogTitle2: "Рост фейковых оптовых предложений в 3-м квартале",
    blogDesc2: "Мы пометили 14 новых подозрительных поставщиков. Вот анатомия автоматизированного скама и то, как наш Агент Рисков отфильтровывает их из вашей воронки.",
    readMore: "Читать Отчет",
    applyToCrm: "Применить в CRM",
    ignore: "Игнорировать"
  },
  es: {
    marketIntelligence: "Inteligencia de Mercado",
    marketIntelligenceSub: "ANÁLISIS DE PRECIOS Y DEMANDA EN TIEMPO REAL",
    marketMedian: "Mediana del Mercado",
    lowestVerified: "Más Bajo Verificado",
    demandPressure: "Presión de Demanda",
    suspiciousPrices: "Precios Sospechosos",
    fromLastWeek: "desde la semana pasada",
    mentions: "menciones / 24h",
    fakeStock: "Posibles estafas / stock falso",
    cheapestVerified: "Los Más Baratos Verificados",
    aiActions: "Recomendaciones AI",
    aiInsightsBlog: "Blog AI del Mercado",
    promoTitle: "Domina el Mercado con Análisis Cognitivo",
    promoDesc: "En 2026 los precios estáticos han muerto. Nuestro motor escanea miles de canales constantemente, cruzando señales de precios y stock ocultos para darte una ventaja competitiva brutal.",
    blogTitle1: "Por qué colapsan los precios de 'HQD Cuvie' en Berlín",
    blogDesc1: "La telemetría en tiempo real detectó una caída del 14% en precios de distribuidores. Mira cómo la IA ajustó los márgenes en automático para captar 4x más leads...",
    blogTitle2: "El aumento de falsos proveedores mayoristas en Q3",
    blogDesc2: "Detectamos 14 nuevos proveedores con precios muy por debajo. Aquí está la anatomía del fraude automatizado y cómo el Agente de Riesgos te protege.",
    readMore: "Leer Informe Completo",
    applyToCrm: "Aplicar",
    ignore: "Ignorar"
  },
  de: {
    marketIntelligence: "Marktintelligenz",
    marketIntelligenceSub: "ECHTZEIT-PREIS- & NACHFRAGEANALYTIK",
    marketMedian: "Markt-Median",
    lowestVerified: "Niedrigster Verifiziert",
    demandPressure: "Nachfragedruck",
    suspiciousPrices: "Verdächtige Preise",
    fromLastWeek: "seit letzter Woche",
    mentions: "Erwähnungen / 24h",
    fakeStock: "Hohes Scam-Risiko",
    cheapestVerified: "Günstigste Verifizierte",
    aiActions: "KI-Empfehlungen",
    aiInsightsBlog: "KI-Markt-Blog",
    promoTitle: "Dominieren Sie den Markt mit kognitiver Analytik",
    promoDesc: "2026 ist statische Preisgestaltung tot. Unsere Engine scannt ständig Tausende von Kanälen, um versteckte Bestände und Preissignale abzugleichen. So erzielen Sie einen einzigartigen Wettbewerbsvorteil.",
    blogTitle1: "Warum die Preise für 'HQD Cuvie Plus' in Berlin kollabieren",
    blogDesc1: "Unsere Echtzeit-Telemetrie hat einen Preisrückgang von 14% bei deutschen Vertriebshändlern festgestellt. Erfahren Sie, wie unsere KI die Margen sicher anpasst...",
    blogTitle2: "Zunahme von Fake-Großhandel-Angeboten im 3. Quartal",
    blogDesc2: "Wir haben 14 neue verdächtige Anbieter markiert. Hier ist die Anatomie eines Scams und wie der Risiko-Agent diese aus Ihrer Pipeline filtert.",
    readMore: "Bericht lesen",
    applyToCrm: "Übernehmen",
    ignore: "Ignorieren"
  },
  fr: {
    marketIntelligence: "Intelligence de Marché",
    marketIntelligenceSub: "ANALYSE DES PRIX ET DE LA DEMANDE EN TEMPS RÉEL",
    marketMedian: "Médiane du Marché",
    lowestVerified: "Plus Bas Vérifié",
    demandPressure: "Pression de la Demande",
    suspiciousPrices: "Prix Suspects",
    fromLastWeek: "depuis la semaine dernière",
    mentions: "mentions / 24h",
    fakeStock: "Arnaques probables",
    cheapestVerified: "Les Moins Chers Vérifiés",
    aiActions: "Recommandations de l'IA",
    aiInsightsBlog: "Blog de l'IA du Marché",
    promoTitle: "Dominez le marché grâce aux insights cognitifs",
    promoDesc: "En 2026, les tarifs statiques sont révolus. Notre moteur analyse continuellement des milliers de canaux, comparant les stocks cachés et les signaux pour vous conférer une longueur d'avance incomparable.",
    blogTitle1: "Pourquoi les prix des 'HQD Cuvie Plus' s'effondrent à Berlin",
    blogDesc1: "Une baisse de 14 % sur les prix moyens en Allemagne a été détectée. Découvrez comment l'IA a réajusté les prix et multiplié le nombre de leads par 4...",
    blogTitle2: "Montée en puissance des faux stocks en Q3",
    blogDesc2: "Nous avons signalé 14 fournisseurs suspects. Voici comment fonctionne l'arnaque et comment l'agent de risque en préserve votre pipeline.",
    readMore: "Lire le rapport complet",
    applyToCrm: "Appliquer",
    ignore: "Ignorer"
  },
  zh: {
    marketIntelligence: "市场情报",
    marketIntelligenceSub: "实时定价与需求分析",
    marketMedian: "市场中位数",
    lowestVerified: "验证的最低价格",
    demandPressure: "需求压力",
    suspiciousPrices: "可疑价格",
    fromLastWeek: "与上周相比",
    mentions: "体积 / 24小时",
    fakeStock: "可能的骗局 / 虚假库存",
    cheapestVerified: "经过验证的最便宜的",
    aiActions: "AI推荐",
    aiInsightsBlog: "AI市场博客",
    promoTitle: "通过认知洞察主导市场",
    promoDesc: "2026年，静态定价已死。我们自治交易引擎实时监控成千上万个频道，通过强大的AI和数据比对给您压倒性的竞争优势。这不是单纯的爬虫——这是人工智能的市场认知化。",
    blogTitle1: "为何柏林的HQD Cuvie Plus价格在暴跌？",
    blogDesc1: "我们的遥测发现德国分销商中位数下降了14%。了解系统是如何毫秒级调价并成功翻倍销售线索的...",
    blogTitle2: "第三季度虚假批发急剧上升",
    blogDesc2: "我们标记了14名提供极低价格的虚构供应商。了解骗局的解剖结构以及风控代理是如何干预的。",
    readMore: "阅读全文",
    applyToCrm: "应用至CRM",
    ignore: "忽略"
  }
};

export const MarketDashboard = ({ themeClasses }: { themeClasses: any }) => {
  const [activeSubTab, setActiveSubTab] = useState<'prices' | 'recommendations' | 'blog'>('prices');
  const { i18n } = useTranslation();

  // Translation hook logic based on App.tsx approach
  const langRaw = i18n.resolvedLanguage || (i18n.language ? i18n.language.split('-')[0] : 'en');
  const langKey = ['ru', 'en', 'es', 'de', 'fr', 'zh'].includes(langRaw) ? langRaw as 'ru' | 'en' | 'es' | 'de' | 'fr' | 'zh' : 'en';
  const t = translations[langKey] || translations.en;

  const formatPrice = (usdAmount: number) => {
    if (langKey === 'ru') {
      return `${Math.round(usdAmount * 90)} ₽`;
    }
    if (langKey === 'zh') {
      return `${Math.round(usdAmount * 7.2)} ¥`;
    }
    if (langKey === 'en') {
      return `$${usdAmount.toFixed(1)}`;
    }
    // Eurozone: es, de, fr
    return `${usdAmount.toFixed(1)} €`;
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Lottie Background Component for 2026 Trend Feel */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 shadow-2xl p-8 bg-gradient-to-br from-indigo-900/90 via-purple-900/80 to-slate-900/90 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-950">
         <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none translate-x-1/3 -translate-y-1/3" />
         <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/3 translate-y-1/3" />
         
         <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 space-y-4 text-white">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 font-bold tracking-widest uppercase text-[10px] backdrop-blur-md border border-white/10 text-blue-200">
                  <Sparkles size={12} className="text-amber-400" />
                  {t.marketIntelligenceSub}
               </div>
               <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                 {t.promoTitle}
               </h1>
               <p className="text-blue-100/80 max-w-xl text-sm md:text-base leading-relaxed">
                 {t.promoDesc}
               </p>
               <div className="pt-4 flex gap-3">
                  <button onClick={() => setActiveSubTab('blog')} className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] flex items-center gap-2">
                    <BookOpen size={18} /> {t.aiInsightsBlog}
                  </button>
                  <button onClick={() => setActiveSubTab('prices')} className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-xl font-bold hover:bg-white/20 transition-colors backdrop-blur-md">
                    {t.cheapestVerified}
                  </button>
               </div>
            </div>
            
            <div className="w-full md:w-1/3 relative flex justify-center">
               <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }} className="w-48 h-48 rounded-full border border-dashed border-white/30 absolute" />
               <motion.div animate={{ rotate: -360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="w-32 h-32 rounded-full border border-dashed border-white/40 absolute mt-8" />
               <div className="w-32 h-32 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl shadow-[0_0_50px_rgba(139,92,246,0.6)] flex items-center justify-center rotate-12 mt-8 z-10 backdrop-blur-xl">
                 <Activity size={48} className="text-white" />
               </div>
            </div>
         </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         <div className={`backdrop-blur-md bg-white/50 dark:bg-gray-900/50 p-5 rounded-2xl border ${themeClasses.cardBorder} shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}>
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2 flex items-center gap-2">
              <Activity size={16} className="text-blue-500"/> {t.marketMedian}
            </div>
            <div className="text-3xl font-black font-mono tracking-tighter">{formatPrice(11.4)}</div>
            <div className="text-xs text-red-500 flex items-center gap-1 mt-2 font-medium bg-red-500/10 w-fit px-2 py-0.5 rounded-full"><ArrowDown size={12}/> 2.1% {t.fromLastWeek}</div>
         </div>
         <div className={`backdrop-blur-md bg-white/50 dark:bg-gray-900/50 p-5 rounded-2xl border ${themeClasses.cardBorder} shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}>
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2 flex items-center gap-2">
              <Zap size={16} className="text-emerald-500"/> {t.lowestVerified}
            </div>
            <div className="text-3xl font-black font-mono tracking-tighter">{formatPrice(10.8)}</div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 mt-2 font-medium bg-emerald-500/10 w-fit px-2 py-0.5 rounded-full">@vape_opt_eu (94%)</div>
         </div>
         <div className={`backdrop-blur-md bg-white/50 dark:bg-gray-900/50 p-5 rounded-2xl border ${themeClasses.cardBorder} shadow-lg hover:shadow-xl transition-all hover:-translate-y-1`}>
            <div className="text-xs uppercase tracking-widest text-gray-500 font-bold mb-2 flex items-center gap-2">
              <Target size={16} className="text-purple-500"/> {t.demandPressure}
            </div>
            <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600 font-mono tracking-tighter">HIGH</div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-2 font-medium bg-purple-500/10 w-fit px-2 py-0.5 rounded-full">120 {t.mentions}</div>
         </div>
         <div className={`backdrop-blur-md bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-5 rounded-2xl border border-orange-200 dark:border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.1)] hover:shadow-[0_0_40px_rgba(249,115,22,0.2)] transition-all hover:-translate-y-1`}>
            <div className="text-xs uppercase tracking-widest text-orange-600 font-bold mb-2 flex items-center gap-2">
              <ShieldAlert size={16} /> {t.suspiciousPrices}
            </div>
            <div className="text-3xl font-black text-orange-600 font-mono tracking-tighter">14</div>
            <div className="text-xs text-orange-700 dark:text-orange-400 mt-2 font-bold bg-orange-500/20 w-fit px-2 py-0.5 rounded-full">{t.fakeStock}</div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className={`backdrop-blur-xl bg-white/80 dark:bg-gray-950/80 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden min-h-[500px] flex flex-col`}>
        
        {/* Navigation */}
        <div className={`flex border-b border-gray-200 dark:border-gray-800 items-center overflow-x-auto custom-scrollbar`}>
           <button onClick={() => setActiveSubTab('prices')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all shrink-0 ${activeSubTab === 'prices' ? 'border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-900/20' : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'}`}>{t.cheapestVerified}</button>
           <button onClick={() => setActiveSubTab('recommendations')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all shrink-0 ${activeSubTab === 'recommendations' ? 'border-purple-500 text-purple-600 bg-purple-50/50 dark:bg-purple-900/20' : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'}`}>{t.aiActions}</button>
           <button onClick={() => setActiveSubTab('blog')} className={`px-6 py-4 text-sm font-bold border-b-2 transition-all shrink-0 flex items-center gap-2 ${activeSubTab === 'blog' ? 'border-pink-500 text-pink-600 bg-pink-50/50 dark:bg-pink-900/20' : 'border-transparent text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900'}`}><BookOpen size={16}/> {t.aiInsightsBlog}</button>
        </div>

        {/* Dynamic Content */}
        <div className="relative flex-1">
           {activeSubTab === 'prices' && (
             <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="p-0 overflow-auto">
               <table className={`w-full text-left text-sm ${themeClasses.text}`}>
                 <thead className={`bg-gray-50/80 dark:bg-gray-900/80 text-gray-500 font-bold sticky top-0 backdrop-blur-md z-10`}>
                   <tr>
                     <th className="px-6 py-4 uppercase tracking-widest text-[10px]">Product</th>
                     <th className="px-6 py-4 uppercase tracking-widest text-[10px]">Seller</th>
                     <th className="px-6 py-4 uppercase tracking-widest text-[10px]">Verified Price</th>
                     <th className="px-6 py-4 uppercase tracking-widest text-[10px]">Confidence</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                   <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                     <td className="px-6 py-5 font-bold text-blue-600 dark:text-blue-400">HQD Cuvie Plus</td>
                     <td className="px-6 py-5 text-gray-600 dark:text-gray-400 font-medium">@vape_opt_eu</td>
                     <td className="px-6 py-5 font-black text-lg font-mono tracking-tight">{formatPrice(10.8)}</td>
                     <td className="px-6 py-5"><span className="px-3 py-1 bg-gradient-to-r from-emerald-400 to-green-500 text-white rounded-full text-xs font-black shadow-lg shadow-green-500/30">94%</span></td>
                   </tr>
                   <tr className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors text-gray-600 dark:text-gray-300">
                     <td className="px-6 py-5 font-bold">Elf Bar 1500</td>
                     <td className="px-6 py-5 font-medium">@kiev_smoke_opt</td>
                     <td className="px-6 py-5 font-black text-lg font-mono tracking-tight">{formatPrice(4.2)}</td>
                     <td className="px-6 py-5"><span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 rounded-full text-xs font-bold">88%</span></td>
                   </tr>
                 </tbody>
               </table>
             </motion.div>
           )}

           {activeSubTab === 'recommendations' && (
             <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="p-8 space-y-6">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 flex flex-col md:flex-row items-start gap-6 p-6 rounded-3xl border border-purple-100 dark:border-purple-900/50 shadow-xl shadow-purple-500/5">
                  <div className="bg-gradient-to-br from-purple-500 to-indigo-600 text-white p-4 rounded-2xl shrink-0 shadow-lg shadow-purple-500/30">
                     <Zap size={28}/>
                  </div>
                  <div className="flex-1">
                     <div className="inline-block px-3 py-1 bg-purple-200 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-[10px] font-black uppercase tracking-widest mb-3">Dynamic Alert</div>
                     <div className="text-gray-900 dark:text-gray-100 font-medium text-lg mb-4 leading-relaxed">
                       AI recommends reducing <span className="font-bold">HQD Cuvie Plus</span> price to match verified market dump (-4%).
                     </div>
                     <div className="flex items-center gap-4 bg-white dark:bg-gray-950/50 rounded-2xl p-4 border border-purple-100 dark:border-purple-900/30 w-fit shadow-inner">
                        <span className="line-through text-gray-400 font-mono font-bold text-lg">{formatPrice(11.4)}</span>
                        <ArrowRightCircle size={24} className="text-purple-500 shrink-0" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 font-mono font-black text-3xl tracking-tighter">{formatPrice(11.0)}</span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100 dark:bg-emerald-950/50 px-3 py-1.5 rounded-lg ml-2 border border-emerald-200 dark:border-emerald-800">OK (Margin: 21%)</span>
                     </div>
                     <div className="mt-6 flex gap-3">
                       <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all outline-none focus:ring-4 focus:ring-purple-500/30">
                         {t.applyToCrm}
                       </button>
                       <button className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                         {t.ignore}
                       </button>
                     </div>
                  </div>
                </div>
             </motion.div>
           )}

           {activeSubTab === 'blog' && (
             <motion.div initial={{opacity:0, filter: 'blur(10px)'}} animate={{opacity:1, filter: 'blur(0px)'}} className="p-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Blog Post 1 */}
                  <div className="group cursor-pointer">
                    <div className="h-48 w-full bg-blue-100 dark:bg-blue-900/30 rounded-3xl mb-4 overflow-hidden relative border border-blue-200 dark:border-blue-800 flex items-center justify-center">
                       <TrendingUp className="text-blue-500/40 w-24 h-24 group-hover:scale-110 transition-transform duration-500" />
                       <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-white font-bold text-sm bg-blue-600 px-3 py-1 rounded-full">{t.readMore}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-pink-500">Market Trends</span>
                      <span className="text-gray-400 text-xs font-medium">• 2 hours ago</span>
                    </div>
                    <h3 className="text-xl font-black leading-tight mb-2 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{t.blogTitle1}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.blogDesc1}</p>
                  </div>

                  {/* Blog Post 2 */}
                  <div className="group cursor-pointer">
                    <div className="h-48 w-full bg-orange-100 dark:bg-orange-900/30 rounded-3xl mb-4 overflow-hidden relative border border-orange-200 dark:border-orange-800 flex items-center justify-center">
                       <ShieldAlert className="text-orange-500/40 w-24 h-24 group-hover:scale-110 transition-transform duration-500" />
                       <div className="absolute inset-0 bg-gradient-to-t from-orange-900/60 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-white font-bold text-sm bg-orange-600 px-3 py-1 rounded-full">{t.readMore}</span>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Security & Scams</span>
                      <span className="text-gray-400 text-xs font-medium">• 1 day ago</span>
                    </div>
                    <h3 className="text-xl font-black leading-tight mb-2 text-gray-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">{t.blogTitle2}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{t.blogDesc2}</p>
                  </div>
               </div>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
};

