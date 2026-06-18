import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Navbar } from './components/landing/Navbar';
import { HeroSection } from './components/landing/HeroSection';
import { BackgroundEffects } from './components/landing/BackgroundEffects';
import { LandingErrorBoundary } from './components/landing/LandingErrorBoundary';
import { CinematicFeatures } from './components/landing/CinematicFeatures';
import { InteractiveGlobe } from './components/landing/InteractiveGlobe';
import { FAQSection } from './components/landing/FAQSection';
import { Globe, Activity, Wifi, Server, Cpu, X } from 'lucide-react';
import AnimatedChatDemo from './components/landing/AnimatedChatDemo';
import { RuntimeTelemetry } from './components/landing/RuntimeTelemetry';

const globeTranslations: Record<string, Record<string, string>> = {
  en: {
    liveRouting: "LIVE ROUTING TELEMETRY",
    gatewayMesh: "Global Distributed Gateway Mesh",
    meshDesc: "Segmented encrypted MTProto channels automatically distribute workload to closest active boundary servers with ultimate zero-FloodWait assurance.",
    activeNodes: "Active Boundary Nodes",
    pingOverview: "PING LATENCY OVERVIEW",
    online: "ONLINE",
    stability: "STABILITY: 99.998%",
    kernel: "KERNEL: V3.0-COGNITIVE",
    interactiveMesh: "Interactive Mesh Control",
    dragRotate: "Left-click and drag or swipe on screen to rotate the network globe dynamically. Global indicators map TeleSync's geographic load-balancing distribution.",
    footerDesc: "Autonomous sales & conversational distribution operating system. High fidelity telemetry, secure MTProto channels, and absolute runtime margin protection.",
    nodesNominal: "All core nodes nominal",
    telemetryLedger: "Telemetry Ledger",
    sysType: "SYS TYPE:",
    activeCell: "ACTIVE COGNITIVE CELL",
    latency: "LATENCY:",
    secureSec: "1.28ms SECURE SEC",
    stabilityIndex: "STABILITY INDEX:",
    version: "VERSION:",
    builtWith: "© 24-26 TeleSync OS. All rights reserved. Built using highly secure ledger-verified cognitive kernels.",
    termsOfService: "Terms of Service",
    privacyPolicy: "Privacy Policy",
    securityLedger: "Security Ledger"
  },
  ru: {
    liveRouting: "ИНТЕРАКТИВНАЯ КАРТА ПОТОКОВ",
    gatewayMesh: "Глобальная распределенная сеть шлюзов",
    meshDesc: "Сегментированные зашифрованные каналы MTProto распределяют нагрузку на ближайшие пограничные узлы с гарантией нулевого FloodWait.",
    activeNodes: "Активные Узлы Шлюза",
    pingOverview: "ОБЗОР ЗАДЕРЖКИ ПИНГА",
    online: "В СЕТИ",
    stability: "СТАБИЛЬНОСТЬ: 99.998%",
    kernel: "ЯДРО: V3.0-COGNITIVE",
    interactiveMesh: "Интерактивное управление сетью",
    dragRotate: "Зажмите левую кнопку мыши или проведите пальцем по экрану для свободного вращения глобуса. Узлы отображают географический баланс нагрузок TeleSync.",
    footerDesc: "Автономная система распределения продаж и коммуникаций. Высокоточная телеметрия, защищенные каналы MTProto и абсолютная защита маржинальности.",
    nodesNominal: "Все узлы функционируют штатно",
    telemetryLedger: "Журнал Телеметрии",
    sysType: "ТИП СИСТЕМЫ:",
    activeCell: "АКТИВНАЯ КОГНИТИВНАЯ ЯЧЕЙКА",
    latency: "ЗАДЕРЖКА:",
    secureSec: "1.28мс (ЗАЩИЩЕННАЯ)",
    stabilityIndex: "ИНДЕКС СТАБИЛЬНОСТИ:",
    version: "ВЕРСИЯ:",
    builtWith: "© 24-26 TeleSync OS. Все права защищены. Построено на защищенных верифицированных когнитивных ядрах.",
    termsOfService: "Условия использования",
    privacyPolicy: "Политика конфиденциальности",
    securityLedger: "Реестр безопасности"
  },
  de: {
    liveRouting: "LIVE-ROUTING-TELEMETRIE",
    gatewayMesh: "Globales verteiltes Gateway-Netzwerk",
    meshDesc: "Segmentierte, verschlüsselte MTProto-Kanäle verteilen die Arbeitslast automatisch auf die nächstgelegenen aktiven Boundary-Server, mit der ultimativen Garantie von null FloodWait.",
    activeNodes: "Aktive Grenzknoten",
    pingOverview: "ÜBERSICHT DER PING-LATENZ",
    online: "ONLINE",
    stability: "STABILITÄT: 99.998%",
    kernel: "KERNEL: V3.0-COGNITIVE",
    interactiveMesh: "Interaktive Netzwerksteuerung",
    dragRotate: "Klicken und ziehen Sie mit der linken Maustaste oder wischen Sie auf dem Bildschirm, um den Netzwerkglobus dynamisch zu drehen. Globale Indikatoren zeigen die geografische Lastverteilung von TeleSync.",
    footerDesc: "Autonomes Vertriebs- und Kommunikationsbetriebssystem. Hochpräzise Telemetrie, sichere MTProto-Kanäle und absoluter Schutz der Marge zur Laufzeit.",
    nodesNominal: "Alle Kernknoten im Normalzustand",
    telemetryLedger: "Telemetriebuch",
    sysType: "SYSTEMTYP:",
    activeCell: "AKTIVE KOGNITIVE ZELLE",
    latency: "LATENZ:",
    secureSec: "1.28ms SICHERER ABSCHNITT",
    stabilityIndex: "STABILITÄTSINDEX:",
    version: "VERSION:",
    builtWith: "© 24-26 TeleSync OS. Alle Rechte vorbehalten. Entwickelt mit hochsicheren Ledger-verifizierten kognitiven Kerneln.",
    termsOfService: "Nutzungsbedingungen",
    privacyPolicy: "Datenschutzerklärung",
    securityLedger: "Sicherheitsbuch"
  },
  fr: {
    liveRouting: "TÉLÉMÉTRIE DE ROUTAGE EN DIRECT",
    gatewayMesh: "Réseau de Passerelles Distribuées Globales",
    meshDesc: "Les canaux MTProto chiffrés et segmentés distribuent automatiquement la charge de travail aux serveurs frontières actifs les plus proches avec la garantie ultime de zéro FloodWait.",
    activeNodes: "Nœuds Frontières Actifs",
    pingOverview: "APERÇU DE LA LATENCE PING",
    online: "EN LIGNE",
    stability: "STABILITÉ: 99.998%",
    kernel: "NOYAU: V3.0-COGNITIVE",
    interactiveMesh: "Contrôle Interactif du Réseau",
    dragRotate: "Glissez avec le clic gauche ou balayez l'écran pour faire pivoter le globe réseau de manière dynamique. Les indicateurs globaux cartographient la répartition de charge géographique de TeleSync.",
    footerDesc: "Système d'exploitation autonome de vente et de distribution conversationnelle. Télémétrie haute fidélité, canaux MTProto sécurisés et protection absolue des marges d'exécution.",
    nodesNominal: "Tous les nœuds centraux nominaux",
    telemetryLedger: "Registre de Télémétrie",
    sysType: "TYPE DE SYSTÈME:",
    activeCell: "CELLULE COGNITIVE ACTIVE",
    latency: "LATENCE:",
    secureSec: "1.28ms SÉCURISÉ SEC",
    stabilityIndex: "INDICE DE STABILITÉ:",
    version: "VERSION:",
    builtWith: "© 24-26 TeleSync OS. Tous droits réservés. Conçu à l'aide de noyaux cognitifs hautement sécurisés vérifiés par registre.",
    termsOfService: "Conditions d'utilisation",
    privacyPolicy: "Politique de confidentialité",
    securityLedger: "Registre de sécurité"
  },
  es: {
    liveRouting: "TELEMETRÍA DE ENRUTAMIENTO EN VIVO",
    gatewayMesh: "Red de Pasarelas Distribuidas Globales",
    meshDesc: "Los canales cifrados y segmentados de MTProto distribuyen automáticamente la carga de trabajo a los servidores fronterizos activos más cercanos con la máxima garantía de cero FloodWait.",
    activeNodes: "Nodos de Frontera Activos",
    pingOverview: "RESUMEN DE LATENCIA DE PING",
    online: "EN LÍNEA",
    stability: "ESTABILIDAD: 99.998%",
    kernel: "NÚCLEO: V3.0-COGNITIVE",
    interactiveMesh: "Control Interactivo de Red",
    dragRotate: "Arrastre con el clic izquierdo o deslice en la pantalla para rotar el globo de red dinámicamente. Los indicadores globales representan la distribución de carga geográfica de TeleSync.",
    footerDesc: "Sistema operativo autónomo de ventas y distribución conversacional. Telemetría de alta fidelidad, canales MTProto seguros y protección absoluta del margen de ejecución.",
    nodesNominal: "Todos los nodos nominales",
    telemetryLedger: "Libro de Telemetría",
    sysType: "TIPO DE SISTEMA:",
    activeCell: "CÉLULA COGNITIVA ACTIVA",
    latency: "LATENCIA:",
    secureSec: "1.28ms SECURE SEC",
    stabilityIndex: "ÍNDICE DE ESTABILIDAD:",
    version: "VERSIÓN:",
    builtWith: "© 24-26 TeleSync OS. Todos los derechos reservados. Desarrollado utilizando núcleos cognitivos altamente seguros verificados por libro de contabilidad.",
    termsOfService: "Términos de servicio",
    privacyPolicy: "Política de privacidad",
    securityLedger: "Libro de seguridad"
  },
  zh: {
    liveRouting: "实时路由遥测",
    gatewayMesh: "全球分布式网关网络",
    meshDesc: "分段加密的 MTProto 通道可自动将工作负载分配到最近的活动边界服务器，并提供最终零 FloodWait 保证。",
    activeNodes: "活动边界节点",
    pingOverview: "PING 延迟概览",
    online: "在线",
    stability: "稳定性: 99.998%",
    kernel: "内核: V3.0-COGNITIVE",
    interactiveMesh: "交互式网格控制",
    dragRotate: "左键点击并拖拽或在屏幕上滑动可动态旋转网络地球仪。全球指标展示了 TeleSync 的地理负载平衡分布。",
    footerDesc: "自主销售和对话分发操作系统。高保真遥测、安全 MTProto通道和绝对的运行时间利润率保护。",
    nodesNominal: "所有核心节点运行正常",
    telemetryLedger: "遥测账本",
    sysType: "系统类型:",
    activeCell: "高度安全的分布式认知内核群",
    latency: "网络延迟:",
    secureSec: "1.28毫秒 安全遥测",
    stabilityIndex: "稳定性指数:",
    version: "核心版本:",
    builtWith: "© 24-26 TeleSync OS. 保留所有权利。采用高安全性账本验证的认知内核构建。",
    termsOfService: "服务条款",
    privacyPolicy: "隐私政策",
    securityLedger: "安全账本"
  }
};

const modalContents: Record<string, Record<string, { title: string; subtitle: string; content: React.ReactNode }>> = {
  en: {
    product: {
      title: "TeleSync OS Platform",
      subtitle: "Autonomous Revenue & Conversational Operating System",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            TeleSync OS delivers terminal-grade conversation automation by synchronizing multi-agent LLM systems with custom Telegram Userbots and WhatsApp API pipelines.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="text-xs font-mono text-blue-400 font-bold block mb-1">COGNITIVE CELL RUNTIME</span>
              <p className="text-xs text-gray-400">Processes inquiries dynamically by analyzing past buyer interactions, current market signals, and custom price metrics.</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="text-xs font-mono text-emerald-400 font-bold block mb-1">MTPROTO GATEWAY MESH</span>
              <p className="text-xs text-gray-400">Guarantees zero-FloodWait execution on natural chats via advanced request partitioning and token management.</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-4">
            System status: nominal // Version: v3.0.12-PRO // Active core: 127.0.0.1
          </p>
        </div>
      )
    },
    features: {
      title: "System Features & Capabilities",
      subtitle: "Enterprise automation tooling overview",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Smart Client Memory Engine:</strong> Parses and recalls buyer histories, preferences, and delivery logs across multiple channels.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Autonomous Negotiations:</strong> Tailors pricing and delivery details dynamically using a multi-step pricing model.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Operator Handover (L2/L3):</strong> Automatically routes highly critical deals or custom queries to your desk in seconds.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Autoposting Engine:</strong> Schedules warmup publications matching optimal channel activity.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Smart Website Orders:</strong> Captures and creates structured orders directly on the website automatically, verifying supplier stock and checking availability beforehand.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Human-in-the-Loop Catalog parsing:</strong> If a client requests a product missing from your site, the AI autonomously generates a draft listing with photos, SEO completeness (Canonical, Schema.org etc.), awaiting manager approval to prevent duplicate bloat.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Margin Control Engine:</strong> Never auto-slashes prices blindly in price-wars. It monitors competitor websites, calculates transport commission margins, applying hard discount rules (min_margin_percent).
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Supplier Trust Score & History:</strong> Engages an authentic "ice-breaking" conversation before inviting to private channels. Automatically grades suppliers based on delivery speed and price history schemas to pick the best strategic partner, not just the cheapest.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">AI Objection Handling ("Too Expensive"):</strong> The CRM actively intercepts objections like "too expensive" during dialogues. The AI automatically counters by suggesting payment splitting or speed bonuses, securely logging the entire negotiation strategy into the deal history.
              </div>
            </li>
          </ul>
        </div>
      )
    },
    technology: {
      title: "Core Technology Stack",
      subtitle: "Engineered for Enterprise scale, durability, and disaster recovery",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            TeleSync OS incorporates reliable open-source frameworks optimized under custom network environments with strict enterprise patterns:
          </p>
          <div className="space-y-2">
            <div className="flex justify-between border-b border-white/5 py-1.5 text-xs font-mono">
              <span className="text-gray-400">Idempotency & Concurrency</span>
              <span className="text-white">Redis Locks + Idempotency Keys to prevent duplicate orders</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1.5 text-xs font-mono">
              <span className="text-gray-400">Event-Driven Architecture</span>
              <span className="text-white">Kafka / RabbitMQ ready Event Bus for async scaling</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1.5 text-xs font-mono">
              <span className="text-gray-400">Databases</span>
              <span className="text-white">PostgreSQL (Primary Schema) + Redis (Cache/Locks)</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1.5 text-xs font-mono">
              <span className="text-gray-400">Observability Stack</span>
              <span className="text-white">Prometheus, Grafana, OpenTelemetry & Sentry enabled</span>
            </div>
          </div>
        </div>
      )
    },
    security: {
      title: "Security Ledger & Authentication",
      subtitle: "Secured on telemetry, RBAC, and administrative boundaries",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            Our security philosophy relies on strict Role-Based Access Control, anti-hallucination layers, and robust AI governance.
          </p>
          <ul className="space-y-2.5 text-xs">
            <li className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <strong className="text-white block">Anti-Hallucination Layer</strong>
                <span className="text-gray-450">Prices & stock fetched directly from PostgreSQL/MoySklad. AI cannot invent data.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px]">VERIFIED</span>
            </li>
            <li className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <strong className="text-white block">AI Approval Levels (Risk-based)</strong>
                <span className="text-gray-455 font-sans">Low-risk: Auto. Medium: Notify. High: Human confirmation only.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">ENFORCED</span>
            </li>
            <li className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <strong className="text-white block">Enterprise RBAC & Audit Log</strong>
                <span className="text-gray-450">Every AI action is deep-logged. Owner/Admin/Procurement hierarchy.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[10px]">COMPLIANT</span>
            </li>
          </ul>
        </div>
      )
    },
    pricing: {
      title: "Subscription & Licensing Pricing",
      subtitle: "Transparent packages tailored to your scale",
      content: (
        <div className="space-y-4 font-sans text-sm text-[#8E9CAE] leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-white font-bold text-base mb-1">Sandbox Node</h4>
                <div className="text-xl font-bold text-blue-400 mb-2">$0 <span className="text-xs text-gray-500 font-normal">/ month</span></div>
                <p className="text-xs text-gray-400 leading-relaxed">Great for local testing and developer integration. 1 active pipeline worker.</p>
              </div>
            </div>
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded-bl-lg font-mono">POPULAR</div>
              <div>
                <h4 className="text-white font-bold text-base mb-1">Growth Core</h4>
                <div className="text-xl font-bold text-blue-400 mb-2">$150 <span className="text-xs text-gray-400 font-normal">/ month</span></div>
                <p className="text-xs text-gray-300 leading-relaxed">Up to 5 message queues, 10,000 automated tokens, custom client storage.</p>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-white font-bold text-base mb-1">Enterprise Grid</h4>
                <div className="text-xl font-bold text-emerald-400 mb-2">Custom <span className="text-xs text-gray-500 font-normal">SLA</span></div>
                <p className="text-xs text-gray-400 leading-relaxed">Custom LLM parameters, dedicated server deployment, SLA up to 99.998%.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    docs: {
      title: "Developer & Operator Guides",
      subtitle: "Technical overview and API access",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed max-h-[45vh] overflow-y-auto pr-2 scrollbar-thin">
          <h4 className="text-white font-bold border-b border-white/5 pb-1">1. How to Obtain Credentials & API Keys</h4>
          <div className="space-y-3 text-xs text-gray-400">
            <p>
              To run the system in live or development mode, you need to collect and set up the following access details:
            </p>
            <ul className="space-y-2 list-disc list-inside bg-white/[0.01] border border-white/5 p-3 rounded-xl">
              <li>
                <strong className="text-white font-semibold">Gemini AI API Key:</strong> Visit <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">Google AI Studio</a>. Click "Get API Key" to generate a free or pay-as-you-go key.
              </li>
              <li>
                <strong className="text-white font-semibold">Telegram Bot Token:</strong> Message the official <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">@BotFather</a> on Telegram. Send <code className="text-emerald-400 bg-black/30 px-1 py-0.5 rounded">/newbot</code>, choose a name, and copy the provided API Token.
              </li>
              <li>
                <strong className="text-white font-semibold">Admin Credentials (ADMIN_TOKEN):</strong> You generate this yourself. Invent a secure, complex string or pass-phrase, write it into your environment variables, and use it to sign in as Admin or authenticate external BI/CRM requests.
              </li>
              <li>
                <strong className="text-white font-semibold">Database Connections:</strong> Spin up a relational PostgreSQL instance using a managed cloud platform (like Supabase or Neon) or launch via standard Docker containers.
              </li>
            </ul>
          </div>

          <h4 className="text-white font-bold border-b border-white/5 pb-1 mt-4">2. Environment Configuration (.env)</h4>
          <p className="text-xs text-gray-400">Store these absolute parameters in your workspace root file:</p>
          <pre className="p-3 bg-black/40 border border-white/5 rounded-lg text-xs font-mono text-emerald-400 block overflow-x-auto whitespace-pre">
{`GEMINI_API_KEY=your_google_studio_key
TELEGRAM_BOT_TOKEN=12345678:ABCdefGhI_klM
DATABASE_URL=postgresql://root:password@host:5432/tele_sync
REDIS_URL=redis://127.0.0.1:6379
ADMIN_TOKEN=your_secure_hash_here`}
          </pre>

          <h4 className="text-white font-bold border-b border-white/5 pb-1 mt-4">3. External Integrations (CRM / ERP API)</h4>
          <p className="text-xs text-gray-400">
            Connect external system processors (amoCRM, Bitrix24, webhook adapters) by making HTTP queries with your admin token in the headers:
          </p>
          <pre className="p-3 bg-black/40 border border-white/5 rounded-lg text-xs font-mono text-blue-400 block overflow-x-auto whitespace-pre">
{`Authorization: Bearer <your_secure_hash_here>`}
          </pre>
          <ul className="space-y-2 text-xs font-mono text-gray-400">
            <li><strong className="text-white">GET /api/leads</strong> - Fetch conversational leads & bargain stages</li>
            <li><strong className="text-white">GET /health/ready</strong> - Read live proxy/routing heartbeat</li>
            <li><strong className="text-white">GET /metrics</strong> - Extract event-loop latency & memory telemetry</li>
          </ul>
        </div>
      )
    },
    termsOfService: {
      title: "Terms of Service",
      subtitle: "License Agreement for TeleSync OS Platform",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed max-h-[45vh] overflow-y-auto pr-2">
          <p>
            By accessing or using TeleSync OS, you agree to comply with this License Agreement.
          </p>
          <h5 className="text-white font-bold text-xs font-mono">1. INTENDED USE</h5>
          <p className="text-xs text-gray-400">
            You are solely responsible for all customer communication content and compliance with legal telecommunication frameworks. Messengers may apply throttling rules if activity indices cross risk bounds.
          </p>
          <h5 className="text-white font-bold text-xs font-mono">2. SYSTEM MARGINS & AUTO-SHUTDOWN</h5>
          <p className="text-xs text-gray-400">
            Automated cognitive operations are regulated by built-in price safety governors. System triggers auto-shutdown processes when emergency anomaly parameters are breached.
          </p>
        </div>
      )
    },
    privacyPolicy: {
      title: "Privacy & Data Policy",
      subtitle: "Data minimization and customer record policies",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            Your data sovereignty remains absolute. TeleSync OS applies real-time data minimization filters in accordance with modern privacy norms.
          </p>
          <div className="space-y-2 text-xs">
            <p className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <strong className="text-white block mb-1">Zero Cloud Recording</strong>
              Customer credentials or personal session records are bound to the tenant workspace and never pooled inside unified databases or cross-trained on external LLMs.
            </p>
            <p className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <strong className="text-white block mb-1">48-Hour Deletion Guarantee</strong>
              Initiate deep cleaning procedures from your admin console to completely purge all local cache databases and logs securely.
            </p>
          </div>
        </div>
      )
    },
    securityLedger: {
      title: "Security Ledger & SLA Audit",
      subtitle: "Live system audit details and registry",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            Verification registry tracking global container execution, memory bounds, and threat logs in real-time.
          </p>
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">SLA INDEX</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">99.998%</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">EVENT LOOP LAG</span>
              <span className="text-blue-400 font-mono font-bold text-lg">&lt; 2.50 ms</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">THREAT INDEX</span>
              <span className="text-emerald-400 font-mono font-bold text-lg font-mono">0.00% NOMINAL</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">DATA LEAKS</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">0 INCIDENTS</span>
            </div>
          </div>
        </div>
      )
    }
  },
  ru: {
    product: {
      title: "Платформа TeleSync OS",
      subtitle: "Автономная система ведения диалогов и управления конверсией",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            TeleSync OS — это ИИ-операционная система уровня Enterprise для автоматизации продаж. Она синхронизирует автономных ИИ-агентов с мессенджерами (Telegram Userbot, WhatsApp API) и внутренними базами данных.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="text-xs font-mono text-blue-400 font-bold block mb-1">КОГНИТИВНАЯ СЕТЬ ПАМЯТИ</span>
              <p className="text-xs text-gray-400">ИИ помнит детали сделки, историю покупок клиентов и автоматически адаптирует стиль переговоров для высокой маржи.</p>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
              <span className="text-xs font-mono text-emerald-400 font-bold block mb-1">ЗАШИФРОВАННЫЙ ШЛЮЗ MTPROTO</span>
              <p className="text-xs text-gray-400">Особое разделение очередей и лимитов отправки гарантирует 100% защиту от блокировок и обход FloodWait.</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 font-mono mt-4">
            Статус системы: штатный // Версия: v3.0.12-PRO // Активное ядро: 127.0.0.1
          </p>
        </div>
      )
    },
    features: {
      title: "Возможности и Инструменты",
      subtitle: "Обзор ключевого функционала автоматизации продаж",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Память клиентов (Memory Engine):</strong> Глубокий анализ предпочтений, сохранение деталей доставки и договоренностей.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Логика переговоров:</strong> ИИ ведет диалог согласно вашим скриптам, умеет гибко торговаться и делать скидки.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Перехват оператором (L2/L3 handover):</strong> При сложных вопросах система отправляет сессию диалога штатному менеджеру.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Умный автопостинг:</strong> Автоматическая генерация прогревающих публикаций в каналы с учетом пиковой активности.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Интеллектуальные Заказы:</strong> Заказы трансформируются на сайте после последовательной цепочки: проверка наличия, сверка условий поставщиков и резервирование, исключая фейковые отгрузки.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Антидубли и Модерация Каталога:</strong> ИИ находит отсутствующий товар в сети, готовит полные SEO-данные (schema.org, canonical, keywords) и сохраняет в «Черновик» для подтверждения менеджером (Human Approval Module).
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Margin Control Engine:</strong> Защита от ценовых войн. ИИ мониторит конкурентов, но перед снижением цены пересчитывает логистику и маржу. Скидки применяются только в рамках безопасных лимитов (max_discount_percent).
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Supplier Trust Score:</strong> Многофакторный рейтинг поставщиков. Бот ведет историю цен каждого, учитывая скорость ответов и процент брака, и не гонится вслепую за самой низкой ценой.
              </div>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 shrink-0"></span>
              <div>
                <strong className="text-white">Перехват возражений («Дорого»):</strong> Интеллектуальная CRM отслеживает возражение «дорого» в диалогах. ИИ автоматически предлагает поставщику или клиенту разбиение платежа либо бонус за скорость, сохраняя весь ход переговоров в историю сделки.
              </div>
            </li>
          </ul>
        </div>
      )
    },
    technology: {
      title: "Технологический Стек Ядра",
      subtitle: "Enterprise-архитектура, Идемпотентность и высокая доступность",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            TeleSync OS использует современно построенный стек технологий для безотказной работы высоконагруженных B2B-закупок:
          </p>
          <div className="space-y-2">
            <div className="flex justify-between border-b border-white/5 py-1.5 text-xs font-mono">
              <span className="text-gray-400">Идемпотентность и Блокировки</span>
              <span className="text-white">PostgreSQL (SELECT FOR UPDATE) + Транзакции (защита от двойных продаж)</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1.5 text-xs font-mono">
              <span className="text-gray-400">Событийно-ориентированная архитектура</span>
              <span className="text-white">Поддержка шины Kafka (Outbox Pattern от потери событий)</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1.5 text-xs font-mono">
              <span className="text-gray-400">Секреты и Катастрофоустойчивость</span>
              <span className="text-white">HashiCorp Vault/AWS Secrets + Point-In-Time Recovery (PITR) бэкапы</span>
            </div>
            <div className="flex justify-between border-b border-white/5 py-1.5 text-xs font-mono">
              <span className="text-gray-400">Мониторинг и Обсервабилити</span>
              <span className="text-white">Prometheus, Grafana, OpenTelemetry, Sentry (Трассировка + Rate Limiting)</span>
            </div>
          </div>
        </div>
      )
    },
    security: {
      title: "Безопасность и RBAC Модель",
      subtitle: "Абсолютный контроль маржинальности, защита от галлюцинаций",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            Архитектура построена на принципах полной изоляции ролей (RBAC) и строгих проверок цен через базу (Anti-Hallucination).
          </p>
          <ul className="space-y-2.5 text-xs">
            <li className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <strong className="text-white block">Anti-Hallucination Layer + AI Firewall</strong>
                <span className="text-gray-400">ИИ получает данные из БД. Аппаратно заблокированы права ИИ удалять объекты. Защита от Prompt Injection.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px]">VERIFIED</span>
            </li>
            <li className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <strong className="text-white block">Chaos Readiness & Нагрузочное тестирование</strong>
                <span className="text-gray-400">Протестировано архитектурой (k6/JMeter). Автоматический fallback и деградация при отказе LLM API или Kafka.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">STRESS-TESTED</span>
            </li>
            <li className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <strong className="text-white block">LLM Cost Control & Financial Audit Log</strong>
                <span className="text-gray-400 font-sans">Ограничение токенов (USD/день). Каждое изменение цен пишется в Pricing_engine_history.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[10px]">ACTIVE</span>
            </li>
          </ul>
        </div>
      )
    },
    governance: {
      title: "Enterprise AI Governance & KPIs",
      subtitle: "Бизнес-метрики, Decision Center и прозрачное управление ИИ",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            Платформа предоставляет Executive Overview с реальным финансовым импактом нейросетевых агентов:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl relative">
              <strong className="text-emerald-400 block text-xs mb-1 uppercase tracking-wider">Business Intelligence</strong>
              <span className="text-sm text-white font-medium">Отслеживание экономии</span>
              <p className="text-gray-400 text-xs mt-1">Оценка Negotiation Win Rate, метрик Revenue Influenced и генерации реальной добавочной стоимости.</p>
            </div>
            <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl relative">
              <strong className="text-blue-400 block text-xs mb-1 uppercase tracking-wider">Understandable AI</strong>
              <span className="text-sm text-white font-medium">AI Decision Center</span>
              <p className="text-gray-400 text-xs mt-1">Confidence Score и Counterfactual Analysis (почему ИИ принял именно это решение и какие альтернативы отбросил).</p>
            </div>
          </div>
        </div>
      )
    },
    modelGovernance: {
      title: "Model Governance & Prompt Registry",
      subtitle: "Полный контроль над версиями моделей и промптов",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            Инфраструктура для управления жизненным циклом ИИ-агентов, обеспечивающая 100% воспроизводимость решений:
          </p>
          <ul className="space-y-2.5 text-xs">
            <li className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <strong className="text-white block">Prompt Registry & Version Control</strong>
                <span className="text-gray-400">Версионирование всех системных инструкций. Полная история изменений промптов.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[10px]">ACTIVE</span>
            </li>
            <li className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex items-center justify-between">
              <div>
                <strong className="text-white block">A/B Testing & Evaluation Benchmarks</strong>
                <span className="text-gray-400">Сравнение эффективности (вирейт переговоров, сэкономленный бюджет) разных версий промптов на лету.</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 font-mono text-[10px]">EVALUATING</span>
            </li>
          </ul>
        </div>
      )
    },
    pricing: {
      title: "Модели Внедрения и Стоимость",
      subtitle: "Прозрачное масштабирование под любые объемы",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-white font-bold text-base mb-1">Sandbox Node</h4>
                <div className="text-xl font-bold text-blue-400 mb-2">0 ₽ <span className="text-xs text-gray-500 font-normal">/ навсегда</span></div>
                <p className="text-xs text-gray-400 leading-relaxed">Для отладки в песочнице и ознакомления. 1 активное мессенджер-подключение.</p>
              </div>
            </div>
            <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-xl flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] uppercase font-bold px-2 py-0.5 rounded-bl-lg font-mono">ПОПУЛЯРНО</div>
              <div>
                <h4 className="text-white font-bold text-base mb-1">Growth Core</h4>
                <div className="text-xl font-bold text-blue-400 mb-2">14 900 ₽ <span className="text-xs text-gray-500 font-normal">/ мес</span></div>
                <p className="text-xs text-gray-300 leading-relaxed">До 5 мессенджер-каналов, автоматический скоринг, защита маржи и 10 000 ИИ-ответов.</p>
              </div>
            </div>
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl flex flex-col justify-between">
              <div>
                <h4 className="text-white font-bold text-base mb-1">Enterprise</h4>
                <div className="text-xl font-bold text-emerald-400 mb-2">Индивидуально <span className="text-xs text-gray-500 font-normal">SLA</span></div>
                <p className="text-xs text-gray-400 leading-relaxed">Выделенный инстанс, дообучение LLM на вашей базе знаний, интеграция с 1С/CRM.</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    docs: {
      title: "Документация и Инструкции",
      subtitle: "Получение ключей, API шифрование и интеграции",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed max-h-[45vh] overflow-y-auto pr-2 scrollbar-thin">
          <h4 className="text-white font-bold border-b border-white/5 pb-1">1. Как и где получить API-ключи и токены?</h4>
          <div className="space-y-3 text-xs text-gray-400">
            <p>
              Для полноценной работы автономной системы вам понадобятся доступы и ключи, которые подключаются на сервере или в панели управления:
            </p>
            <ul className="space-y-2 list-disc list-inside bg-white/[0.01] border border-white/5 p-3 rounded-xl">
              <li>
                <strong className="text-white font-semibold">Токен Telegram-бота:</strong> Зайдите в официальный бот <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline hover:text-white">@BotFather</a> в Telegram, отправьте команду <code className="text-emerald-400 bg-black/30 px-1 py-0.5 rounded">/newbot</code>, укажите желаемое имя бота, и скопируйте выданный API-токен (вида <code className="text-gray-300">12345678:AA...</code>).
              </li>
              <li>
                <strong className="text-white font-semibold">ИИ-ключ Gemini API Key:</strong> Перейдите на официальный портал разработчиков <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline hover:text-white">Google AI Studio</a>. Нажмите "Get API Key" для мгновенной генерации секретного токена для ИИ-копилота.
              </li>
              <li>
                <strong className="text-white font-semibold">Ключ Администратора (ADMIN_TOKEN):</strong> Вы создаете этот токен самостоятельно. Впишите любую надежную сложную строку (пароль) в параметры окружения. Этот токен служит паролем для входа в Админ-панель оператора и ключом авторизации запросов.
              </li>
              <li>
                <strong className="text-white font-semibold">База данных PostgreSQL:</strong> Подключите внешнюю базу на облачной платформе (например, Supabase, Neon) или создайте её локально через Docker-образ PostgreSQL.
              </li>
            </ul>
          </div>

          <h4 className="text-white font-bold border-b border-white/5 pb-1 mt-4">2. Конфигурация Окружения (.env)</h4>
          <p className="text-xs text-gray-400">Внесите собранные ключи в корневой файл `.env` вашей рабочей среды:</p>
          <pre className="p-3 bg-black/40 border border-white/5 rounded-lg text-xs font-mono text-emerald-400 block overflow-x-auto whitespace-pre">
{`GEMINI_API_KEY=ваш_секретный_ключ_ai_studio
TELEGRAM_BOT_TOKEN=ваш_токен_из_bot_father
DATABASE_URL=postgresql://root:password@host:5432/tele_sync
REDIS_URL=redis://127.0.0.1:6379
ADMIN_TOKEN=ваш_придуманный_токен_авторизации`}
          </pre>

          <h4 className="text-white font-bold border-b border-white/5 pb-1 mt-4">3. Интеграция с внешними CRM (amoCRM, Bitrix24 и др.)</h4>
          <p className="text-xs text-gray-400">
            Для забора лидов, выгрузки данных сделок или контроля статуса делайте REST-запросы, передавая ваш индивидуальный <code className="text-blue-400">ADMIN_TOKEN</code> в заголовках HTTP-авторизации:
          </p>
          <pre className="p-3 bg-black/40 border border-white/5 rounded-lg text-xs font-mono text-blue-400 block overflow-x-auto whitespace-pre">
{`Authorization: Bearer <ваш_придуманный_токен_авторизации>`}
          </pre>
          <ul className="space-y-2 text-xs font-mono text-gray-400">
            <li><strong className="text-white">GET /api/leads</strong> - Позволяет забирать обновляемый список контактов и стадий сделок</li>
            <li><strong className="text-white">GET /health/ready</strong> - Проверка задержки и активности шлюзов отправки</li>
            <li><strong className="text-white">GET /metrics</strong> - Сбор технической телеметрии о нагрузке и задержках памяти</li>
          </ul>
        </div>
      )
    },
    termsOfService: {
      title: "Условия использования",
      subtitle: "Пользовательское соглашение и лицензия TeleSync OS",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed max-h-[45vh] overflow-y-auto pr-2">
          <p>
            Настоящее соглашение регулирует правила эксплуатации когнитивного комплекса TeleSync OS.
          </p>
          <h5 className="text-white font-bold text-xs font-mono">1. ПРАВИЛА ИСПОЛЬЗОВАНИЯ</h5>
          <p className="text-xs text-gray-400">
            Пользователь обязуется не использовать ИИ-агентов для спама, фишинга или распространения запрещенных категорий товаров. Все лимиты мессенджеров должны строго соблюдаться оператором.
          </p>
          <h5 className="text-white font-bold text-xs font-mono">2. АВТОПИЛОТ И ОТВЕТСТВЕННОСТЬ</h5>
          <p className="text-xs text-gray-400">
            Система ИИ генерирует предложения динамически на основе информации из базы знаний. Мы не несем ответственности за возможные разногласия с покупателями во время автономных торгов; используйте функцию ручного контроля лимитов.
          </p>
        </div>
      )
    },
    privacyPolicy: {
      title: "Политика конфиденциальности",
      subtitle: "Защита и минимизация собираемых персональных сведений",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            Конфиденциальность клиентов и защита коммерческой тайны — основа безопасности TeleSync OS.
          </p>
          <div className="space-y-2 text-xs">
            <p className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <strong className="text-white block mb-1">Изоляция Воркспейсов</strong>
              Ваша база знаний, прайс-листы и логи переписок не используются для глобального обучения внешних языковых моделей и никогда не передаются третьим лицам.
            </p>
            <p className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <strong className="text-white block mb-1">Гарантия Безопасности</strong>
              Чувствительные платежные реквизиты или личные пароли автоматически маскируются на границе обработки ИИ-шлюзом.
            </p>
          </div>
        </div>
      )
    },
    securityLedger: {
      title: "Реестр безопасности и соответствия",
      subtitle: "Официальный аудит защищенности ядра системы ТелеСинк",
      content: (
        <div className="space-y-4 font-sans text-sm text-gray-300 leading-relaxed">
          <p>
            Публичный аудит ядра системы под нагрузочным тестированием.
          </p>
          <div className="grid grid-cols-2 gap-3 text-center text-xs">
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">ИНДЕКС ДОСТУПНОСТИ SLA</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">99.998% ШТАТНО</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">ЗАДЕРЖКА EVENT LOOP LOGS</span>
              <span className="text-blue-400 font-mono font-bold text-lg">&lt; 2.50 мс</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">ИНДЕКС СБОЕВ ЯДРА</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">0.00%</span>
            </div>
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
              <span className="text-gray-500 block mb-1 uppercase tracking-wider text-[10px]">ИНЦИДЕНТЫ УТЕЧЕК</span>
              <span className="text-emerald-400 font-mono font-bold text-lg">0 НЕТ</span>
            </div>
          </div>
        </div>
      )
    }
  }
};

interface PrivacyPolicyViewProps {
  lang: string;
}

const PrivacyPolicyView: React.FC<PrivacyPolicyViewProps> = ({ lang }) => {
  const [selectedRegion, setSelectedRegion] = useState<'AZ' | 'EU' | 'US' | 'RU' | 'CIS' | 'CN' | 'UK' | 'ARAB' | 'IR' | 'ME'>('AZ');
  const [detectedRegion, setDetectedRegion] = useState<'AZ' | 'EU' | 'US' | 'RU' | 'CIS' | 'CN' | 'UK' | 'ARAB' | 'IR' | 'ME' | null>(null);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      const nLang = (navigator.language || "").toLowerCase();
      
      let detected: 'AZ' | 'EU' | 'US' | 'RU' | 'CIS' | 'CN' | 'UK' | 'ARAB' | 'IR' | 'ME' = 'EU';
      if (
        tz.includes("Baku") || 
        nLang === "az" || 
        nLang.startsWith("az-")
      ) {
        detected = "AZ";
      } else if (tz.includes("Moscow") || tz.includes("Yekaterinburg") || nLang === "ru") {
        detected = "RU";
      } else if (tz.includes("Minsk") || tz.includes("Almaty") || tz.includes("Tashkent") || tz.includes("Bishkek") || tz.includes("Dushanbe") || tz.includes("Yerevan")) {
        detected = "CIS";
      } else if (tz.includes("London") || tz.includes("Belfast") || nLang === "en-gb") {
        detected = "UK";
      } else if (tz.includes("Shanghai") || tz.includes("Beijing") || tz.includes("Chongqing") || tz.includes("Urumqi") || nLang === "zh") {
        detected = "CN";
      } else if (tz.includes("Tehran") || nLang === "fa") {
        detected = "IR";
      } else if (tz.includes("Dubai") || tz.includes("Riyadh") || tz.includes("Qatar") || tz.includes("Kuwait") || tz.includes("Bahrain")) {
        detected = "ARAB";
      } else if (tz.includes("Amman") || tz.includes("Beirut") || tz.includes("Cairo") || tz.includes("Istanbul") || nLang === "ar") {
        detected = "ME";
      } else if (
        tz.includes("America/") || 
        tz.includes("US/") || 
        nLang === "en-us"
      ) {
        detected = "US";
      } else {
        detected = "EU";
      }
      setDetectedRegion(detected);
      setSelectedRegion(detected);
    } catch (e) {
      setDetectedRegion('AZ');
      setSelectedRegion('AZ');
    }
  }, []);

  const tPolicy = {
    AZ: {
      standard: lang === 'ru' ? 'Закон АР «О персональных данных»' : 'Law of AR "On Personal Data"',
      desc: lang === 'ru'
        ? 'Базовый регламент защиты персональных данных согласно законодательству Азербайджанской Республики (№ 998-IIIQ).'
        : 'Primary personal data protection framework subject to the legislation of the Republic of Azerbaijan (Law No. 998-IIIQ).',
      bullets: [
        {
          title: lang === 'ru' ? 'Государственная регистрация ИС' : 'State Registration of Information Systems',
          text: lang === 'ru'
            ? 'Программная платформа полностью соблюдает требования об обязательной регистрации систем персональных данных внутри страны.'
            : 'Software architecture accommodates compliance for mandatory state registration of personal data systems per national rules.'
        },
        {
          title: lang === 'ru' ? 'Сбор с согласия субъекта' : 'Lawful Basis and Consent',
          text: lang === 'ru'
            ? 'Сбор и обработка информации пользователей в мессенджерах осуществляется только при наличии электронного или письменного согласия.'
            : 'End-user data collection strictly via digital or written opt-in mechanisms to maintain legitimate grounds of processing.'
        },
        {
          title: lang === 'ru' ? 'Трансграничная передача' : 'Cross-Border Exchange Checks',
          text: lang === 'ru'
            ? 'Передача данных внешним ИИ-провайдерам соответствует протоколам трансграничной передачи с обеспечением адекватного уровня защиты.'
            : 'Routing data packets to external LLM endpoints operates under protocols ensuring adequate security for cross-border transmission.'
        }
      ]
    },
    EU: {
      standard: lang === 'ru' ? 'Стандарт соответствия GDPR' : 'GDPR Compliance Framework',
      desc: lang === 'ru' 
        ? 'Регламент ЕС 2016/679 (General Data Protection Regulation). Обеспечивает строгий контроль за согласием и защитой прав резидентов Европы.'
        : 'Regulation (EU) 2016/679. Guarantees supreme user consent, localized processing bounds, and individual data control for European Union citizens.',
      bullets: [
        {
          title: lang === 'ru' ? 'Обязательное согласие (Opt-In)' : 'Strict Opt-In Consent',
          text: lang === 'ru' 
            ? 'ИИ-приложение активирует анализ предпочтений клиента исключительно после явного интерактивного согласия в диалоговой ветке.'
            : 'Conversational analytics and client memory engines are initialized strictly after explicit recipient consent.'
        },
        {
          title: lang === 'ru' ? 'Право на забвение (Art. 17 GDPR)' : 'Right to Be Forgotten',
          text: lang === 'ru'
            ? 'Вы можете полностью удалить персональные переписки и логи клиента за 48 часов одним кликом в панели управления.'
            : 'Tenant databases support instant permanent purges of individual transaction threads directly from the administrator hub.'
        },
        {
          title: lang === 'ru' ? 'Отсутствие глобального обучения' : 'Siloed Models (No Pooling)',
          text: lang === 'ru'
            ? 'Коммерческие диалоги изолированы в рамках вашего инстанса и никогда не передаются в общий пул для дообучения глобальных моделей.'
            : 'Dialogue sequences and knowledge sheets are bound strictly to your isolated host, never pooled for global LLM weights training.'
        }
      ]
    },
    US: {
      standard: lang === 'ru' ? 'Положения CCPA / COPPA Compliance' : 'CCPA & COPPA Regulatory Standards',
      desc: lang === 'ru'
        ? 'Закон штата Калифорния о конфиденциальности потребителей (CCPA) и федеральное законодательство США по защите данных.'
        : 'State-level mandates including California Consumer Privacy Act (CCPA) and federal regulatory criteria of online customer data security.',
      bullets: [
        {
          title: lang === 'ru' ? 'Право на отказ от продажи данных' : 'Do Not Sell My Personal Info (CCPA)',
          text: lang === 'ru'
            ? 'TeleSync OS гарантирует абсолютный запрет на скрытую передачу или коммерческий шеринг истории контактов рекламным сетям.'
            : 'Fully complies with opt-out mechanisms. Third-party visual nodes and advertising integrations have zero gateway access.'
        },
        {
          title: lang === 'ru' ? 'Защита несовершеннолетних (COPPA)' : 'COPPA Children Protection',
          text: lang === 'ru'
            ? 'Встроенные контентные фильтры блокируют обработку детских персональных данных и не сохраняют их в транзакционном кэше.'
            : 'Conversational message processing automatically intercepts and drops telemetry flags for age-restricted interactions.'
        },
        {
          title: lang === 'ru' ? 'Запросы раскрытия информации' : 'Customer Disclosure Portals',
          text: lang === 'ru'
            ? 'Предусмотрен автоматизированный экспорт полной карточки данных клиента с выгрузкой по первому требованию.'
            : 'Operators can export readable comprehensive client profiles immediately upon valid digital disclosure requests.'
        }
      ]
    },
    RU: {
      standard: lang === 'ru' ? 'Соответствие ФЗ-152 «О персональных данных»' : 'Federal Law No. 152-FZ Compliance',
      desc: lang === 'ru'
        ? 'Российские государственные регламенты обработки и локализации персональных данных граждан РФ.'
        : 'Federal regulations on processing and localization of personal developer and customer files inside Russian border structures.',
      bullets: [
        {
          title: lang === 'ru' ? 'Локализация БД на территории РФ (ст. 18)' : 'Database Localization Rule',
          text: lang === 'ru'
            ? 'По умолчанию базы PostgreSQL и кэши Redis развертываются на серверах внутри РФ (Яндекс.Облако, VK Cloud или локальный хост).'
            : 'Primary PostgreSQL host schemas and BullMQ key-stores must reside physically on regional server clusters located inside the RF.'
        },
        {
          title: lang === 'ru' ? 'Согласие на обработку ПД' : 'User Consent Mechanics',
          text: lang === 'ru'
            ? 'Приветственные сценарии в мессенджерах содержат ссылки на оферту. Лог подтверждения согласия надежно фиксируется в БД.'
            : 'Standard messaging prompts deliver brief legal policy disclaimers. Confirmation timestamps are logged into localized system records.'
        },
        {
          title: lang === 'ru' ? 'Маскирование и обезличивание данных' : 'Automated Data Masking layer',
          text: lang === 'ru'
            ? 'До отправки в ИИ-шлюз вся текстовая информация зачищается от паспортных данных, ИНН и СНИЛС сменяемыми масками.'
            : 'The routing layer automatically intercepts and replaces passport codes, tax IDs (INN), or phone figures with custom hash placeholders before LLM queries.'
        }
      ]
    },
    CIS: {
      standard: lang === 'ru' ? 'Межпарламентская Ассамблея СНГ (Модельный закон)' : 'CIS Model Law on Personal Data',
      desc: lang === 'ru' ? 'Единые принципы обработки персональных данных в странах СНГ, адаптируемые под национальные законы участников.' : 'Unified principles of processing personal data across CIS countries, adapted to national laws.',
      bullets: [
        {
          title: lang === 'ru' ? 'Трансграничный обмен внутри СНГ' : 'Cross-border Data Exchange within CIS',
          text: lang === 'ru' ? 'Бесшовный обмен данными между странами-участницами СНГ при обеспечении базового уровня защиты.' : 'Seamless data exchange among CIS member states ensuring a baseline level of protection.'
        },
        {
          title: lang === 'ru' ? 'Согласие субъекта ' : 'Subject Consent Requirements',
          text: lang === 'ru' ? 'Требуется явное согласие пользователя на обработку данных алгоритмами машинного обучения.' : 'Explicit user consent is required for processing data by machine learning algorithms.'
        },
        {
          title: lang === 'ru' ? 'Локализация ПД' : 'Data Localization in respective states',
          text: lang === 'ru' ? 'Возможность локализации баз данных в пределах границ конкретной страны СНГ по запросу.' : 'Ability to localize databases within the borders of a specific CIS country upon request.'
        }
      ]
    },
    CN: {
      standard: lang === 'ru' ? 'Закон о защите ПИ (PIPL)' : 'Personal Information Protection Law (PIPL)',
      desc: lang === 'ru' ? 'Закон КНР о защите персональной информации, устанавливающий строгие требования к данным резидентов Китая.' : 'The Personal Information Protection Law of the PRC, establishing strict requirements for Chinese residents\' data.',
      bullets: [
        {
          title: lang === 'ru' ? 'Государственная оценка безопасности' : 'State Security Assessment',
          text: lang === 'ru' ? 'Обязательная государственная проверка перед передачей чувствительных данных за пределы Китая.' : 'Mandatory state security review before transferring sensitive data outside of China.'
        },
        {
          title: lang === 'ru' ? 'Отдельное согласие на ИИ' : 'Separate Consent for Automated Decision Making',
          text: lang === 'ru' ? 'Пользователи должны предоставить отдельное согласие на использование их данных в рекомендательных системах.' : 'Users must provide distinct consent for their data usage in recommendation algorithms.'
        },
        {
          title: lang === 'ru' ? 'Локализация' : 'Mainland Server Localization',
          text: lang === 'ru' ? 'Развертывание облачных баз данных строго на серверах материкового Китая (AliCloud, Tencent).' : 'Cloud database deployment strictly on mainland China servers (AliCloud, Tencent).'
        }
      ]
    },
    UK: {
      standard: lang === 'ru' ? 'UK GDPR & Data Protection Act 2018' : 'UK GDPR & Data Protection Act 2018',
      desc: lang === 'ru' ? 'Британский свод законов о защите данных, регулирующий конфиденциальность после Brexit.' : 'The United Kingdom\'s data protection framework, governing privacy post-Brexit.',
      bullets: [
        {
          title: lang === 'ru' ? 'Защита от автоматизированных решений' : 'Protection Against Automated Decision-Making',
          text: lang === 'ru' ? 'Право пользователя требовать пересмотра решений, принятых ИИ в процессе общения или торговли.' : 'The right of users to request a human review of algorithmic decisions made during commerce interactions.'
        },
        {
          title: lang === 'ru' ? 'Международная передача данных' : 'Adequacy Regulations',
          text: lang === 'ru' ? 'Передача данных регулируется Британскими правилами адекватности для обеспечения безопасности (IDTA).' : 'Data transfers are governed by UK adequacy regulations (IDTA) to ensure secure transmissions.'
        },
        {
          title: lang === 'ru' ? 'Подотчетность ICO' : 'ICO Accountability and Compliance',
          text: lang === 'ru' ? 'Строгие правила отчетности перед Офисом Уполномоченного по информации (ICO).' : 'Strict framework for transparency, compliance tracking, and reporting to the Information Commissioner’s Office.'
        }
      ]
    },
    ARAB: {
      standard: lang === 'ru' ? 'Регулирование в странах GCC' : 'GCC Data Protection Regulations',
      desc: lang === 'ru' ? 'Законы о защите данных в арабских государствах Персидского залива (ОАЭ, Саудовская Аравия, Катар).' : 'Data protection alignments across Gulf Cooperation Council states (UAE, KSA, Qatar).',
      bullets: [
        {
          title: lang === 'ru' ? 'Суверенитет данных' : 'Data Sovereignty and Residence',
          text: lang === 'ru' ? 'Чувствительные данные и записи пользователей хранятся в дата-центрах внутри стран GCC.' : 'Sensitive records and user histories stay within regional GCC data centers.'
        },
        {
          title: lang === 'ru' ? 'Этические ограничения' : 'Cultural Alignment and Filtering',
          text: lang === 'ru' ? 'Строгие ограничения на контент ИИ для соответствия локальным юридическим и культурным нормам.' : 'Strict AI content output limitations to ensure adherence to local legal frameworks.'
        },
        {
          title: lang === 'ru' ? 'Явное согласие на маркетинг' : 'Clear Marketing Consent',
          text: lang === 'ru' ? 'Отдельные механизмы подтверждения обработки контактов для прямых интернет-продаж.' : 'Dedicated confirmation loops required before utilizing contacts for direct promotional outreach.'
        }
      ]
    },
    IR: {
      standard: lang === 'ru' ? 'Закон о защите данных (Иран)' : 'Electronic Commerce Law & Data Protection',
      desc: lang === 'ru' ? 'Своды правил и принципы Исламской Республики Иран по защите данных в электронной коммерции.' : 'Islamic Republic of Iran’s framework regarding electronic commerce and user privacy.',
      bullets: [
        {
          title: lang === 'ru' ? 'Внутренняя локализация' : 'Domestic Database Localization',
          text: lang === 'ru' ? 'Хостинг систем управления клиентами осуществляется в рамках национального интранета (NIN).' : 'Hosting of customer systems must be compliant with the National Information Network provisions.'
        },
        {
          title: lang === 'ru' ? 'Модерация ИИ-контента' : 'Algorithmic Content Moderation',
          text: lang === 'ru' ? 'Тщательный контроль генерации текста для предотвращения нарушения культурных норм страны.' : 'Careful moderation of generative text paths to protect against cultural or state norm violations.'
        },
        {
          title: lang === 'ru' ? 'Защита цифровых сделок' : 'Digital Trade Safeguards',
          text: lang === 'ru' ? 'Использование шифрования для защиты данных электронной коммерции от перехватов.' : 'Implementation of secure envelopes for digital trades to protect transactional data.'
        }
      ]
    },
    ME: {
      standard: lang === 'ru' ? 'Универсальные стандарты MENA' : 'MENA Regional Alignment',
      desc: lang === 'ru' ? 'Гибкие политики для региона Ближнего Востока и Северной Африки (Египет, Левант, Иордания и др.).' : 'Flexible privacy configurations adopted for Middle East and North Africa (Egypt, Levant, Jordan, etc.).',
      bullets: [
        {
          title: lang === 'ru' ? 'Адаптивный механизм согласия' : 'Adaptive Consent Workflows',
          text: lang === 'ru' ? 'Поддержка многоуровневого согласия на обработку в зависимости от страны обращения пользователя.' : 'Multi-tier consent dialogues tailored to the origin nation of the interacting user.'
        },
        {
          title: lang === 'ru' ? 'Шифрование при передаче' : 'Encrypted Regional Transport',
          text: lang === 'ru' ? 'Безопасное прохождение данных между узлами связи с использованием локальной криптографии.' : 'Secure data traversal across regional nodes adhering to varying state cryptography demands.'
        },
        {
          title: lang === 'ru' ? 'Конфиденциальность' : 'Conversation Confidentiality',
          text: lang === 'ru' ? 'Механизмы автоматического удаления или анонимизации чатов по требованию местных властей.' : 'Mechanisms for automated chat decay or anonymization as designated by distinct local laws.'
        }
      ]
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-400 text-xs sm:text-sm">
        {lang === 'ru' 
          ? 'Политика конфиденциальности TeleSync OS динамически подстраивается под стандарты юрисдикции клиента для исключения штрафов и блокировок.'
          : 'TeleSync OS privacy guidelines dynamically adjust to regional legal standards to secure operations against regulatory constraints.'}
      </p>

      {/* Region selector tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'AZ', label: '🇦🇿 Azerbaijan', ruLabel: '🇦🇿 Азербайджан' },
          { id: 'EU', label: '🇪🇺 Europe', ruLabel: '🇪🇺 Евросоюз' },
          { id: 'RU', label: '🇷🇺 Russia', ruLabel: '🇷🇺 Россия' },
          { id: 'CIS', label: '🤝 CIS', ruLabel: '🤝 Страны СНГ' },
          { id: 'US', label: '🇺🇸 USA', ruLabel: '🇺🇸 США' },
          { id: 'CN', label: '🇨🇳 China', ruLabel: '🇨🇳 Китай' },
          { id: 'UK', label: '🇬🇧 UK', ruLabel: '🇬🇧 Великобритания' },
          { id: 'ARAB', label: '🇦🇪 Arab States', ruLabel: '🇦🇪 Арабские страны' },
          { id: 'IR', label: '🇮🇷 Iran', ruLabel: '🇮🇷 Иран' },
          { id: 'ME', label: '🌍 Middle East', ruLabel: '🌍 Ближний Восток' }
        ] as const).map((reg) => {
          const isActive = selectedRegion === reg.id;
          const isDetected = detectedRegion === reg.id;
          return (
            <button
              key={reg.id}
              onClick={() => setSelectedRegion(reg.id)}
              className={`relative flex items-center justify-center px-3 py-2 rounded-xl border transition-all cursor-pointer outline-none bg-transparent ${
                isActive 
                  ? 'border-blue-500/80 bg-blue-500/10 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                  : 'border-white/[0.06] hover:border-white/10 hover:bg-white/[0.02] text-gray-400 hover:text-gray-200'
              }`}
            >
              <span className="text-[11px] sm:text-xs font-bold leading-tight whitespace-nowrap">
                {lang === 'ru' ? reg.ruLabel : reg.label}
              </span>
              {isDetected && (
                <span className="absolute -top-1.5 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[7px] font-mono leading-none tracking-tight uppercase border border-emerald-500/20 shadow-sm">
                  {lang === 'ru' ? 'Авто' : 'Auto'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Region Content */}
      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/[0.05] space-y-4 animate-in fade-in duration-300">
        <div>
          <span className="inline-block px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-mono text-[9px] uppercase font-bold tracking-wider mb-1.5">
            {tPolicy[selectedRegion].standard}
          </span>
          <p className="text-xs text-gray-400 leading-relaxed font-sans">
            {tPolicy[selectedRegion].desc}
          </p>
        </div>

        <div className="space-y-3">
          {tPolicy[selectedRegion].bullets.map((b, idx) => (
            <div key={idx} className="p-3 bg-white/[0.015] border border-white/[0.03] rounded-lg">
              <strong className="text-xs text-white block mb-1 font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                {b.title}
              </strong>
              <p className="text-[11px] text-gray-400 leading-relaxed font-sans">
                {b.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Landing = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || (i18n.language ? i18n.language.split('-')[0] : 'en');
  const lt = globeTranslations[lang] || globeTranslations.en;
  
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Real-time state for live telemetry nodes
  const [nodePings, setNodePings] = useState<Record<string, number>>({
    'Node-EU (Frankfurt)': 12,
    'Node-US-East (NY)': 78,
    'Node-JP (Tokyo)': 142,
    'Node-SG (Singapore)': 110,
    'Node-AU (Sydney)': 155,
    'Node-BR (São Paulo)': 94,
    'Node-US-West (SF)': 65,
    'Node-UK (London)': 18,
    'Node-ZA (Johannesburg)': 125
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setNodePings(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(key => {
          // Add small fluctuation
          const delta = Math.floor(Math.random() * 5) - 2;
          next[key] = Math.max(5, next[key] + delta);
        });
        return next;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);
  return (
    <LandingErrorBoundary>
      <Helmet>
        <title>TeleSync OS - Autonomous Revenue Infrastructure</title>
        <meta name="description" content="AI-native sales operating system. Verified telemetry. Distributed routing." />
      </Helmet>
      
      <div className="min-h-screen bg-[#020617] text-gray-100 font-sans selection:bg-blue-500/30 overflow-x-hidden relative">
        <BackgroundEffects />
        <Navbar onOpenModal={(tab) => setActiveModal(tab)} />

        <main className="relative pt-20 lg:pt-24 pb-0 z-10 hidden-scrollbar max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex flex-col lg:flex-row items-start justify-between gap-8 lg:gap-12 w-full">
             
             {/* Left Text Column */}
             <div className="w-full lg:w-[40%] shrink-0 pt-0 flex flex-col justify-start relative z-20">
               <HeroSection />
             </div>
             
             {/* Dashboard Widget Column */}
             <div className="w-full lg:w-[60%] relative z-30 flex justify-center lg:justify-end">
               <div className="w-full max-w-[850px] relative z-10 perspective-1500px">
                 {/* Intense Backlight Glow for Cognitive Core */}
                 <div className="absolute inset-0 bg-gradient-to-r from-purple-600/60 via-fuchsia-600/60 to-indigo-600/60 blur-[60px] -z-10 rounded-[40px] pointer-events-none"></div>
                 <div className="absolute inset-0 bg-indigo-500/30 blur-[100px] -z-10 rounded-[40px] animate-pulse pointer-events-none" style={{ animationDuration: '5s' }}></div>
                 
                 <AnimatedChatDemo />
               </div>
             </div>
          </div>

          <div id="governance" className="w-full relative z-40 mt-10 md:mt-12 max-w-screen-xl mx-auto flex flex-col items-center justify-center">
             
             {/* Massive background glow for Runtime Governance */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[150%] max-w-[1200px] pointer-events-none -z-10 flex items-center justify-center">
                <div className="absolute w-[80%] h-[80%] bg-blue-500/20 blur-[150px] rounded-[100%] opacity-50 mix-blend-screen"></div>
                <div className="absolute w-[60%] h-[60%] bg-emerald-500/20 blur-[120px] rounded-[100%] opacity-60 mix-blend-screen"></div>
             </div>

             <div className="text-center mb-10 w-full flex flex-col items-center relative z-10">
               <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">{t('landing.gov_title', 'Runtime Governance')}</h2>
               <p className="text-gray-400 text-lg md:text-xl font-medium max-w-2xl">{t('landing.gov_desc', 'Monitor distributed queues, telemetry fabric, and MTProto routing layer.')}</p>
             </div>
             <div className="w-full relative z-10 flex justify-center">
                <RuntimeTelemetry />
             </div>
          </div>

          {/* Cinematic Features (The rest of the page) */}
          <div className="w-full relative z-40 mt-10 md:mt-12">
             <div id="features"><CinematicFeatures /></div>
             
             {/* Frequently Asked Questions Section */}
             <div id="faq" className="w-full relative z-40">
                <FAQSection />
             </div>

             {/* Dedicated Interactive Globe Section between FAQ and Footer */}
             <section className="mt-10 py-10 border-t border-b border-white/[0.06] bg-black relative overflow-hidden z-40">
               {/* Ambient background glows */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none -z-10"></div>
               <div className="absolute bottom-0 right-10 w-[300px] h-[300px] bg-green-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

               <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center mb-16">
                   
                   <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                     {lt.gatewayMesh}
                   </h2>
                   <p className="text-[#8E9CAE] text-base md:text-lg max-w-2xl mx-auto">
                     {lt.meshDesc}
                   </p>
                 </div>

                 {/* Grid Layout: Left side active node console, Right side interactive globe */}
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                   {/* Node Console Tracker Code Interface */}
                   <div className="lg:col-span-5 space-y-6">
                     <div className="bg-[#0b1019]/90 border border-white/10 rounded-2xl p-5 shadow-2xl backdrop-blur-xl font-mono">
                       <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-4">
                         <div className="flex items-center gap-2">
                           <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                           <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                             {lt.activeNodes}
                           </span>
                         </div>
                         <span className="text-[10px] text-slate-500">{lt.pingOverview}</span>
                       </div>

                       <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                         {Object.entries(nodePings).map(([nodeName, pingVal]) => {
                           const ping = pingVal as number;
                           // Get color level
                           const colorClass = ping < 30 ? 'text-emerald-400' : ping < 100 ? 'text-blue-400' : 'text-purple-400';
                           const dotColor = ping < 30 ? 'bg-emerald-500' : ping < 100 ? 'bg-blue-500' : 'bg-purple-500';

                           return (
                             <div key={nodeName} className="flex items-center justify-between p-2.5 rounded-xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                               <div className="flex items-center gap-2.5 text-xs text-gray-300 font-medium font-sans">
                                 <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
                                 {nodeName}
                               </div>
                               <div className="flex items-center gap-2 shrink-0">
                                 <span className="text-[10px] text-gray-400 uppercase">{lt.online}</span>
                                 <span className={`text-[11px] font-bold ${colorClass} w-10 text-right`}>{ping}ms</span>
                               </div>
                             </div>
                           );
                         })}
                       </div>

                       <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 justify-between items-center text-[10px] text-gray-500">
                         <div className="flex items-center gap-1">
                           <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                           <span>{lt.stability}</span>
                         </div>
                         <div className="flex items-center gap-1">
                           <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                           <span>{lt.kernel}</span>
                         </div>
                       </div>
                     </div>

                     {/* Interactive Controls Guidance */}
                     <div className="p-4 rounded-2xl border border-white/5 bg-white/[0.01] backdrop-blur-sm">
                       <h4 className="text-sm font-semibold text-gray-200 mb-1 flex items-center gap-2">
                         <Wifi className="w-4 h-4 text-blue-500" />
                         {lt.interactiveMesh}
                       </h4>
                       <p className="text-xs text-gray-400 leading-relaxed">
                         {lt.dragRotate}
                       </p>
                     </div>
                   </div>

                   {/* Large Glowing Globe Display */}
                   <div className="lg:col-span-7 flex justify-center items-center relative h-[380px] sm:h-[450px] md:h-[500px] xl:h-[540px]">
                     <div className="absolute inset-0 pointer-events-none border border-white/[0.01] rounded-3xl [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] -z-10"></div>
                     <div className="w-full h-full max-w-[500px] lg:max-w-full relative z-10 font-sans">
                       <InteractiveGlobe />
                     </div>
                   </div>
                 </div>
               </div>
             </section>
             
             {/* Beautiful Premium Footer */}
             <footer className="mt-12 border-t border-white/[0.08] pt-12 pb-4 relative overflow-hidden z-10">
                {/* Background Glow inside footer */}
                <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-600/10 blur-[100px] rounded-full pointer-events-none -z-10"></div>
                <div className="absolute bottom-0 left-10 w-[200px] h-[200px] bg-purple-600/5 blur-[80px] rounded-full pointer-events-none -z-10"></div>

               <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-white/[0.05] relative z-10">
                 {/* Column 1: Brand Info */}
                 <div className="space-y-4 md:col-span-1">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 flex items-center justify-center opacity-90">
                       <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-500">
                         <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                         <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                         <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                       </svg>
                     </div>
                     <span className="text-white text-lg font-bold tracking-tight">TeleSync OS</span>
                   </div>
                   <p className="text-gray-400 text-xs leading-relaxed max-w-sm">
                     {lt.footerDesc}
                   </p>
                   {/* PING status */}
                   <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-wider text-emerald-400">
                     <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                     {lt.nodesNominal}
                   </div>
                 </div>

                 {/* Column 2: Platform Links */}
                 <div className="space-y-3">
                   <h4 className="text-xs uppercase tracking-widest text-gray-200 font-bold">{lang === 'ru' ? 'Платформа' : lang === 'de' ? 'Plattform' : lang === 'fr' ? 'Plateforme' : lang === 'es' ? 'Plataforma' : lang === 'zh' ? '平台' : 'Platform'}</h4>
                   <ul className="space-y-2 text-xs text-gray-400">
                     <li><button onClick={() => setActiveModal('product')} className="hover:text-white transition-all cursor-pointer bg-transparent border-none p-0 text-left outline-none block w-full text-xs font-semibold">{t('nav.product', 'Product')}</button></li>
                     <li><button onClick={() => setActiveModal('features')} className="hover:text-white transition-all cursor-pointer bg-transparent border-none p-0 text-left outline-none block w-full text-xs font-semibold">{t('nav.features', 'Features')}</button></li>
                     <li><button onClick={() => setActiveModal('technology')} className="hover:text-white transition-all cursor-pointer bg-transparent border-none p-0 text-left outline-none block w-full text-xs font-semibold">{t('nav.technology', 'Technology')}</button></li>
                     <li><button onClick={() => setActiveModal('security')} className="hover:text-white transition-all cursor-pointer bg-transparent border-none p-0 text-left outline-none block w-full text-xs font-semibold">{t('nav.security', 'Security')}</button></li>
                     <li><button onClick={() => setActiveModal('governance')} className="hover:text-white transition-all cursor-pointer bg-transparent border-none p-0 text-left outline-none block w-full text-xs font-semibold">AI Governance</button></li>
                     <li><button onClick={() => setActiveModal('modelGovernance')} className="hover:text-white transition-all cursor-pointer bg-transparent border-none p-0 text-left outline-none block w-full text-xs font-semibold">Model Governance</button></li>
                   </ul>
                 </div>

                 {/* Column 3: Resources Links */}
                 <div className="space-y-3">
                   <h4 className="text-xs uppercase tracking-widest text-gray-200 font-bold">{lang === 'ru' ? 'Ресурсы' : lang === 'de' ? 'Ressourcen' : lang === 'fr' ? 'Ressources' : lang === 'es' ? 'Recursos' : lang === 'zh' ? '资源' : 'Resources'}</h4>
                   <ul className="space-y-2 text-xs text-gray-400">
                     <li><button onClick={() => setActiveModal('pricing')} className="hover:text-white transition-all cursor-pointer bg-transparent border-none p-0 text-left outline-none block w-full text-xs font-semibold">{t('nav.pricing', 'Pricing')}</button></li>
                     <li><button onClick={() => setActiveModal('docs')} className="hover:text-white transition-all cursor-pointer bg-transparent border-none p-0 text-left outline-none block w-full text-xs font-semibold">{t('nav.docs', 'Docs')}</button></li>
                     <li><button onClick={() => setActiveModal('docs')} className="hover:text-white transition-all cursor-pointer bg-transparent border-none p-0 text-left outline-none block w-full text-xs font-semibold">{lang === 'ru' ? 'Справочник API' : lang === 'de' ? 'API-Referenz' : lang === 'fr' ? 'Référence API' : lang === 'es' ? 'Referencia de API' : lang === 'zh' ? 'API 参考' : 'API Reference'}</button></li>
                     <li><button onClick={() => setActiveModal('docs')} className="hover:text-white transition-all cursor-pointer bg-transparent border-none p-0 text-left outline-none block w-full text-xs font-semibold">{lang === 'ru' ? 'Консоль разработчика' : lang === 'de' ? 'Entwicklerkonsole' : lang === 'fr' ? 'Console de développement' : lang === 'es' ? 'Consola de desarrollador' : lang === 'zh' ? '开发者控制台' : 'Dev Console'}</button></li>
                   </ul>
                 </div>

                 {/* Column 4: Operational Status */}
                 <div className="space-y-3">
                   <h4 className="text-xs uppercase tracking-widest text-gray-200 font-bold">{lt.telemetryLedger}</h4>
                   <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl space-y-2 text-[10px] font-mono text-gray-500">
                     <div className="flex justify-between">
                       <span>{lt.sysType}</span> <span className="text-blue-400">{lt.activeCell}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>{lt.latency}</span> <span className="text-emerald-400">{lt.secureSec}</span>
                     </div>
                     <div className="flex justify-between">
                       <span>{lt.stabilityIndex}</span> <span className="text-gray-300">99.9975%</span>
                     </div>
                     <div className="flex justify-between">
                       <span>{lt.version}</span> <span className="text-gray-400">v3.0.12-PRO</span>
                     </div>
                   </div>
                 </div>
               </div>

               {/* Bottom bar */}
               <div className="mt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500 relative z-10">
                 <div className="order-2 md:order-1">
                   {lt.builtWith}
                 </div>
                 <div className="flex gap-6 order-1 md:order-2">
                   <span onClick={() => setActiveModal('termsOfService')} className="hover:text-gray-300 transition-colors cursor-pointer">{lt.termsOfService}</span>
                   <span onClick={() => setActiveModal('privacyPolicy')} className="hover:text-gray-300 transition-colors cursor-pointer">{lt.privacyPolicy}</span>
                   <span onClick={() => setActiveModal('securityLedger')} className="hover:text-gray-300 transition-colors cursor-pointer">{lt.securityLedger}</span>
                 </div>
               </div>
             </footer>
          </div>
        </main>

        {/* Modal Overlay / Slide-Over drawer for Product info sheets */}
        <AnimatePresence>
          {activeModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setActiveModal(null)}
              className="fixed inset-0 bg-[#020617]/85 backdrop-blur-xl z-[100] flex items-center justify-center p-4 sm:p-6 cursor-pointer"
            >
              {/* Modal Container */}
              <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.96 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1, 
                  transition: { type: 'spring', damping: 26, stiffness: 360 } 
                }}
                exit={{ 
                  opacity: 0, 
                  y: 20, 
                  scale: 0.97, 
                  transition: { duration: 0.18 } 
                }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0b1329] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-[0_0_50px_rgba(30,58,138,0.3)] relative text-left cursor-default"
              >
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/[0.08] bg-white/[0.01]">
                  <div>
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {modalContents[lang]?.[activeModal]?.title || modalContents.en[activeModal]?.title}
                    </h3>
                    <p className="text-xs text-blue-400 font-mono mt-0.5 uppercase tracking-wider">
                      {modalContents[lang]?.[activeModal]?.subtitle || modalContents.en[activeModal]?.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent outline-none"
                    title="Close Dialog"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto hidden-scrollbar flex-1 text-gray-300">
                  {activeModal === 'privacyPolicy' ? (
                    <PrivacyPolicyView lang={lang} />
                  ) : (
                    modalContents[lang]?.[activeModal]?.content || modalContents.en[activeModal]?.content
                  )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-white/[0.01] border-t border-white/[0.06] flex justify-end gap-3">
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white rounded-lg transition-all duration-200 cursor-pointer border-none outline-none"
                  >
                    {lang === 'ru' ? 'Закрыть' : 'Close'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LandingErrorBoundary>
  );
};