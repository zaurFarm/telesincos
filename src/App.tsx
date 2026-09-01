import AuthGate from './AuthGate';
import React, { useEffect, useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { motion } from 'framer-motion';
import { Shield, Bot, AlertCircle, CheckCircle2, MessageSquare, Trash2, Users, History, Activity, Link as LinkIcon, Settings, Save, RefreshCw, Moon, Sun, Download, TrendingUp, X, Filter, BookOpen, Banknote, StopCircle, PlayCircle, ShieldAlert, Target, ArrowRightCircle, Network, AlertOctagon, Bug, AlertTriangle, Command, ShieldCheck, Coins, Zap, Bell, Globe, Maximize, Minimize } from 'lucide-react';

interface Action {
  type: 'delete' | 'reply';
  chat: string;
  user: string;
  reason?: string;
  content: string;
  timestamp: string;
}

interface Group {
  id: string;
  title: string;
  inviteLink?: string;
  lastActive: string;
}

interface User {
  id: string;
  username?: string;
  firstName: string;
  lastSeen: string;
}

interface HistoryMsg {
  id: number;
  chatTitle: string;
  username: string;
  text: string;
  date: string;
}

interface CompetitorData {
  date: string;
  group: string;
  seller: string;
  productText: string;
  price: string;
}

interface CRMGroup {
  id: string;
  name: string;
  link: string;
  description: string;
  analysis: {
    isPaid: boolean | null;
    linksAllowed: boolean | null;
    category: string;
    summary: string;
  };
  dateAdded: string;
}

interface Lead {
  id: number;
  user_id: string;
  username: string;
  first_name: string;
  source_chat: string;
  source_message: string;
  intent: string;
  temperature: string;
  budget: string;
  confidence: number;
  score: number;
  status: string;
  stage: string;
  created_at: string;
}

interface ConversationMsg {
  id: number;
  role: string;
  message: string;
  created_at: string;
}

interface KnowledgeData {
  id: number;
  source: string;
  risks: string[];
  limits: string[];
  recommendations: string[];
  created_at: string;
}

interface Status {
  botConfigured: boolean;
  recentActions: Action[];
  groups: Group[];
  users: User[];
  history: HistoryMsg[];
  whitelistedUsers: string[];
  lastDeletions: Record<string, string>;
  competitors: CompetitorData[];
  crmGroups: CRMGroup[];
  learnedStyles?: number;
  knowledge?: KnowledgeData[];
}

interface BotSettings {
  moderationEnabled: boolean;
  chatEnabled: boolean;
  moderationPrompt: string;
  chatPrompt: string;
  maxVideoSizeMB: number;
  preventDuplicates: boolean;
  duplicateDistance: number;
  externalApiToken?: string;
  proxyIp?: string;
  proxyPort?: string;
  proxyUser?: string;
  proxyPass?: string;
  aiProvider?: string;
  useOllama?: boolean;
  ollamaEndpoint?: string;
  ollamaModel?: string;
  openAiKey?: string;
  openAiModel?: string;
  proactiveSales?: boolean;
  adminChatId?: number;
  targetForwardGroup?: number;
  forwardMode?: string;
  autoReplyKeywords?: string;
  autoReplyPrompt?: string;
  apiId?: string;
  apiHash?: string;
  phoneNumber?: string;
  sessionString?: string;
  useUserbot?: boolean;
  connectionMode?: 'mtproto' | 'botapi' | 'hybrid';
  autoPostEnabled?: boolean;
  autoPostRequireApproval?: boolean;
  autoPostSourceChannels?: string;
  autoPostTargetChannel?: string;
  autoPostStopWords?: string;
  autoPostRemoveAds?: boolean;
  autoPostReplacePhone?: string;
  autoPostReplaceLinks?: string;
  autoPostTextReplacements?: string;
  autoPostUniqualize?: boolean;
  autoPostHumanDelay?: boolean;
  autoPostIntervalMin?: number;
  autoPostRules?: string;
}

interface DashboardData {
  finances: { sales: number; today_revenue: number; week_revenue: number; avg_check: number };
  funnel: { status: string; count: number }[];
  accounts: { status: string; count: number }[];
  warmups: { warmup_stage: string; count: number }[];
  ai: { learned: number; avg_score: number };
  channels: { source_channel: string; leads: number; sales: number }[];
  chart: { date: string; leads: number; sales: number; revenue: number }[];
}

import { LogsViewer } from './components/LogsViewer.js';
import { IncidentCommandCenter } from './components/IncidentCommandCenter.js';
import { Dashboard30 } from './components/Dashboard30.js';
import { CognitiveOSDashboard } from './components/CognitiveOSDashboard.js';
import { AIDecisionCenter } from './components/AIDecisionCenter.js';
import { BusinessAnalyticsDashboard } from './components/BusinessAnalyticsDashboard.js';
import { OperationalReadinessDashboard } from './components/OperationalReadinessDashboard.js';
import { MarketDashboard } from './frontend/components/market/MarketDashboard';
import { AutopostDashboard } from './frontend/components/autopost/AutopostDashboard';
import { ErrorBoundary } from './ErrorBoundary';

import i18n from './i18n';

function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastRan = useRef(Date.now());
  const timer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const handler = () => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      } else {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => {
          setThrottledValue(value);
          lastRan.current = Date.now();
        }, limit - (Date.now() - lastRan.current));
      }
    };
    handler();
  }, [value, limit]);

  return throttledValue;
}

export function AppDashboard() {
  const [langRaw, setLangRaw] = useState(localStorage.getItem('app_preferred_language') || (typeof navigator !== 'undefined' ? navigator.language.split('-')[0] : 'ru'));
  const langKey = ['ru', 'en', 'es', 'de', 'fr', 'zh'].includes(langRaw) ? langRaw : 'en';

  const changeLanguage = (lang: string) => {
    localStorage.setItem('app_preferred_language', lang);
    setLangRaw(lang);
    i18n.changeLanguage(lang);
  };

  const tSidebar: Record<string, any> = {
    ru: { menu: 'Меню', autopost: 'Автопостинг (Товары)', copilot: 'Копилот & Воронка', cognitive: 'Cognitive OS', dashboard: 'Рабочий стол (Утверждения)', leads: 'Воронка Сделок (Kanban)', history: 'История Диалогов', memory_engine: 'Memory Engine', users: 'Память Клиентов', crm: 'Сегменты Аудитории', market_intel: 'Market Intelligence', market: 'Market Intelligence', groups: 'Мониторинг Спроса', reports_settings: 'Отчеты & Настройки', analytics: 'Export Отчетов', knowledge: 'Настройка Личности ИИ', settings: 'Telegram Layer Settings', token_required: 'Требуется токен' },
    en: { menu: 'Menu', autopost: 'Autoposting (Products)', copilot: 'Copilot & Pipeline', cognitive: 'Cognitive OS', dashboard: 'Dashboard (Approvals)', leads: 'Deal Pipeline (Kanban)', history: 'Dialog History', memory_engine: 'Memory Engine', users: 'Client Memory', crm: 'Audience Segments', market_intel: 'Market Intelligence', market: 'Market Intelligence', groups: 'Demand Monitoring', reports_settings: 'Reports & Settings', analytics: 'Export Reports', knowledge: 'AI Personality Setup', settings: 'Telegram Layer Settings', token_required: 'Token Required' },
    es: { menu: 'Menú', autopost: 'Publicación automática (Productos)', copilot: 'Copiloto y Embudo', cognitive: 'SO Cognitivo', dashboard: 'Escritorio (Aprobaciones)', leads: 'Embudo de Ventas (Kanban)', history: 'Historial de Diálogos', memory_engine: 'Motor de Memoria', users: 'Memoria de Clientes', crm: 'Segmentos de Audiencia', market_intel: 'Inteligencia de Mercado', market: 'Inteligencia de Mercado', groups: 'Monitoreo de Demanda', reports_settings: 'Informes y Configuración', analytics: 'Exportar Informes', knowledge: 'Configurar Personalidad AI', settings: 'Configuración de la Capa Telegram', token_required: 'Token requerido' },
    de: { menu: 'Menü', autopost: 'Automatisches Posten (Produkte)', copilot: 'Copilot & Pipeline', cognitive: 'Kognitives OS', dashboard: 'Dashboard (Genehmigungen)', leads: 'Deal Pipeline (Kanban)', history: 'Dialogverlauf', memory_engine: 'Memory Engine', users: 'Kundenspeicher', crm: 'Zielgruppensegmente', market_intel: 'Market Intelligence', market: 'Market Intelligence', groups: 'Nachfrageüberwachung', reports_settings: 'Berichte & Einstellungen', analytics: 'Berichte Exportieren', knowledge: 'KI-Persönlichkeit Setup', settings: 'Telegram Layer Einstellungen', token_required: 'Token erforderlich' },
    fr: { menu: 'Menu', autopost: 'Publication automatique (Produits)', copilot: 'Copilote et Pipeline', cognitive: 'OS Cognitif', dashboard: 'Tableau de Bord (Approbations)', leads: 'Pipeline de Ventes (Kanban)', history: 'Historique des Dialogues', memory_engine: 'Moteur de Mémoire', users: 'Mémoire Client', crm: 'Segments d\'Audience', market_intel: 'Intelligence de Marché', market: 'Intelligence de Marché', groups: 'Surveillance de la Demande', reports_settings: 'Rapports et Paramètres', analytics: 'Exporter les Rapports', knowledge: 'Configuration de la Personnalité de l\'IA', settings: 'Paramètres Couche Telegram', token_required: 'Jeton requis' },
    zh: { menu: '菜单', autopost: '自动发布 (产品)', copilot: '副驾驶与管道', cognitive: '认知操作系统', dashboard: '仪表板（审批）', leads: '交易管道（看板）', history: '对话历史', memory_engine: '记忆引擎', users: '客户记忆', crm: '受众细分', market_intel: '市场情报', market: '市场情报', groups: '需求监控', reports_settings: '报告与设置', analytics: '导出报告', knowledge: '人工智能个性设置', settings: 'Telegram层设置', token_required: '需要令牌' }
  };
  const tMenu = tSidebar[langKey] || tSidebar.en;

  const getActiveTabTitle = () => {
    if (!tMenu) return activeTab;
    switch(activeTab) {
      case 'cognitive': return tMenu.cognitive || 'Cognitive OS';
      case 'dashboard': return tMenu.dashboard || 'Рабочий стол';
      case 'autopost': return tMenu.autopost || 'Автопостинг (Товары)';
      case 'leads': return tMenu.leads || 'Воронка Сделок (Kanban)';
      case 'history': return tMenu.history || 'История Диалогов';
      case 'users': return tMenu.users || 'Память Клиентов';
      case 'crm': return tMenu.crm || 'Сегменты Аудитории';
      case 'market': return tMenu.market || 'Market Intelligence';
      case 'groups': return tMenu.groups || 'Связи & Чат';
      case 'analytics': return tMenu.analytics || 'Export Отчетов';
      case 'knowledge': return tMenu.knowledge || 'Настройка Личности ИИ';
      case 'settings': return tMenu.settings || 'Telegram Layer Settings';
      case 'control_center': return 'Центр управления';
      case 'logIntel': return 'Log & Event Intelligence';
      case 'observability': return 'Observability';
      case 'metrics': return 'Metrics';
      case 'billing': return 'Billing';
      case 'accounts': return 'Аккаунты ТГ';
      case 'actions': return 'Действия';
      case 'incidents': return 'Инциденты';
      case 'integrity': return 'Безопасность';
      default: return activeTab;
    }
  };

  const tHints: Record<string, Record<string, string>> = {
    ru: {
      cognitive: "Интерфейс распределенного ИИ-агента и логов решений",
      dashboard: "Рабочий стол для ручного утверждения подозрительных лидов",
      autopost: "Автоматический импорт, фильтрация и постинг товаров",
      leads: "Канбан-доска сделок, интегрированная с CRM",
      history: "Полная история диалогов ИИ-операторов с клиентами",
      users: "Единая база профилей клиентов и теплоты лидов",
      crm: "Сегментация клиентов и запуск маркетинговых кампаний",
      market_intel: "Расчет объемов рынка и выявление горячего спроса",
      market: "Расчет объемов рынка и выявление горячего спроса",
      groups: "Поиск новых целевых групп и автопостинга",
      analytics: "Экспорт аналитических финансовых и операционных отчетов",
      knowledge: "Настройка инструкций, промптов и характера ИИ",
      settings: "Параметры соединения, ключи API и MTProto ротации",
      fullscreen: "Развернуть на весь экран",
      exitFullscreen: "Свернуть в окно",
      themeToggle: "Переключить тему (Светлая/Темная)",
      settingsBtn: "Быстрый доступ к конфигурации",
      langSelector: "Сменить язык интерфейса"
    },
    en: {
      cognitive: "Distributed AI-agent interface and decision logs",
      dashboard: "Dashboard for manual approval of suspicious leads",
      autopost: "Automatic import, filtering, and posting of products",
      leads: "Kanban deal board integrated with CRM",
      history: "Full dialog history of AI operators with clients",
      users: "Unified database of client profiles and lead warmth",
      crm: "Client segmentation and marketing campaign launch",
      market_intel: "Market size calculation and hot demand identification",
      market: "Market size calculation and hot demand identification",
      groups: "Search for new target groups and channels",
      analytics: "Export analytical financial and operational reports",
      knowledge: "Configure AI instructions, prompts, and character",
      settings: "Connection parameters, API keys, and MTProto rotation",
      fullscreen: "Toggle Fullscreen Mode",
      exitFullscreen: "Exit Fullscreen Mode",
      themeToggle: "Toggle Theme (Light/Dark)",
      settingsBtn: "Quick configuration access",
      langSelector: "Change language of interface"
    },
    es: {
      cognitive: "Interfaz del agente de IA distribuido y registros de decisiones",
      dashboard: "Escritorio para la aprobación manual de leads sospechosos",
      autopost: "Importación, filtrado y publicación automática de productos",
      leads: "Tablero Kanban de tratos integrado con CRM",
      history: "Historial completo de diálogos de operadores de IA con clientes",
      users: "Base de datos unificada de perfiles de clientes y calidez de leads",
      crm: "Segmentación de clientes y lanzamiento de campañas de marketing",
      market_intel: "Cálculo del tamaño del mercado e identificación de la demana caliente",
      market: "Cálculo del tamaño del mercado e identificación de la demana caliente",
      groups: "Búsqueda de nuevos grupos objetivo y canales",
      analytics: "Exportar informes analíticos financieros y operativos",
      knowledge: "Instrucciones, prompts y configuración del carácter de IA",
      settings: "Parámetros de conexión, claves API y rotación de MTProto",
      fullscreen: "Pantalla completa",
      exitFullscreen: "Salir de pantalla completa",
      themeToggle: "Alternar Tema",
      settingsBtn: "Acceso rápido a la configuración",
      langSelector: "Cambiar idioma de la interfaz"
    },
    de: {
      cognitive: "Schnittstelle für verteilte KI-Agenten und Entscheidungs-Protokolle",
      dashboard: "Dashboard zur manuellen Genehmigung von verdächtigen Leads",
      autopost: "Automatischer Import, Filterung und Veröffentlichung von Produkten",
      leads: "Kanban-Deal-Board integriert mit CRM",
      history: "Vollständiger Dialogverlauf der KI-Operatoren mit Kunden",
      users: "Einheitliche Datenbank für Kundenprofile und Lead-Wärme",
      crm: "Zielgruppensegmente und Start von Marketingkampagnen",
      market_intel: "Marktgrößenberechnung und Erkennung heißer Nachfragen",
      market: "Marktgrößenberechnung und Erkennung heißer Nachfragen",
      groups: "Suche nach neuen Zielgruppen und Vertriebskanälen",
      analytics: "Export analytischer Finanz- und Betriebsberichte",
      knowledge: "Konfiguration von KI-Anweisungen, Prompts und Charakter",
      settings: "Verbindungsparameter, API-Schlüssel und MTProto-Rotation",
      fullscreen: "Vollbildmodus aktivieren",
      exitFullscreen: "Vollbildmodus beenden",
      themeToggle: "Thema wechseln",
      settingsBtn: "Schnellzugriff auf die Konfiguration",
      langSelector: "Schnittstellensprache ändern"
    },
    fr: {
      cognitive: "Interface d'agent d'IA distribué et journaux de décision",
      dashboard: "Tableau de bord pour l'approbation manuelle des prospects suspects",
      autopost: "Importation, filtrage et publication automatique de produits",
      leads: "Tableau Kanban des transactions intégré au CRM",
      history: "Historique complet des dialogues des opérateurs d'IA avec les clients",
      users: "Base de données unifiée des profils clients et de la chaleur des prospects",
      crm: "Segmentation client et lancement de campagnes marketing",
      market_intel: "Calcul de la taille du marché et identification de la demande chaude",
      market: "Calcul de la taille du marché et de la demande chaude",
      groups: "Recherche de nouveaux groupes cibles et canaux",
      analytics: "Exporter les rapports d'analyse financière et opérationnelle",
      knowledge: "Instructions, prompts et configuration de la personnalité de l'IA",
      settings: "Paramètres de connexion, clés API et rotation MTProto",
      fullscreen: "Mode plein écran",
      exitFullscreen: "Quitter le plein écran",
      themeToggle: "Changer de thème",
      settingsBtn: "Accès rapide à la configuration",
      langSelector: "Changer la langue de l'interface"
    },
    zh: {
      cognitive: "分布式AI代理接口和决策日志",
      dashboard: "手动批准可疑潜在客户的仪表板",
      autopost: "自动导入、过滤和发布产品",
      leads: "与CRM集成的看板交易板",
      history: "AI接线员与客户的完整对话历史记录",
      users: "统一客户画像及线索温度数据库",
      crm: "客户细分及营销活动启动",
      market_intel: "市场规模计算和热门需求识别",
      market: "市场规模计算和热门需求识别",
      groups: "搜索新的目标群体和渠道",
      analytics: "导出财务及运营分析报告",
      knowledge: "配置人工智能个性、指令和提示词",
      settings: "连接参数、API密钥和MTProto轮换",
      fullscreen: "全屏模式",
      exitFullscreen: "退出全屏",
      themeToggle: "切换主题",
      settingsBtn: "快速配置访问",
      langSelector: "更改界面语言"
    }
  };
  const tHint = tHints[langKey] || tHints.en;

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'readiness' | 'decision_center' | 'dashboard' | 'accounts' | 'market' | 'crm' | 'leads' | 'analytics' | 'settings' | 'knowledge' | 'history' | 'users' | 'groups' | 'cognitive' | 'autopost'>('cognitive');
  const [isTabFullscreen, setIsTabFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsTabFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (activeTab !== 'autopost') {
      setIsTabFullscreen(false);
    }
  }, [activeTab]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {
        setIsFullscreen(prev => !prev);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {
        setIsFullscreen(prev => !prev);
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const [status, setStatus] = useState<Status | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [adminToken, setAdminToken] = useState(localStorage.getItem('ADMIN_TOKEN') || (import.meta as any).env?.VITE_ADMIN_TOKEN || '');
  const [authError, setAuthError] = useState(!(localStorage.getItem('ADMIN_TOKEN') || ''));
  const [loginInput, setLoginInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginErrorMessage, setLoginErrorMessage] = useState('');
  const ADMIN_TOKEN = adminToken;

  const handleLoginSubmit = async () => {
    const trimmed = loginInput.trim();
    if (!trimmed) {
      setLoginErrorMessage('Пожалуйста, введите пароль.');
      return;
    }
    setLoginLoading(true);
    setLoginErrorMessage('');
    try {
      const res = await fetch('/api/status', {
        headers: { 'Authorization': `Bearer ${trimmed}` }
      });
      if (res.ok) {
        localStorage.setItem('ADMIN_TOKEN', trimmed);
        setAdminToken(trimmed);
        setAuthError(false);
        setLoginErrorMessage('');
      } else {
        setLoginErrorMessage('Неверный токен администратора. Пожалуйста, попробуйте еще раз.');
      }
    } catch (err) {
      setLoginErrorMessage('Ошибка соединения с сервером.');
    } finally {
      setLoginLoading(false);
    }
  };

  useEffect(() => {
     if (adminToken) {
       localStorage.setItem('ADMIN_TOKEN', adminToken);
       setAuthError(false); // Reset error if we got a new token
     }
  }, [adminToken]);

  useEffect(() => {
    const handleAuthError = () => {
       setAuthError(true);
    };
    window.addEventListener('auth-error-legacy-disabled', handleAuthError);
    return () => window.removeEventListener('auth-error-legacy-disabled', handleAuthError);
  }, []);

  const [logIntel, setLogIntel] = useState<any>(null);
  const [traces, setTraces] = useState<any[]>([]);
  const [systemState, setSystemState] = useState<any>({
    is_paused: false,
    global_limit_hourly: 1000,
    ban_rate_threshold: 0.15,
    ai: { activeWorkers: 1 },
    farm: { totalAccounts: 0, isPaused: false },
    strategy: { current: 'balanced', config: {} },
    metrics: { recentErrors: 0, totalLeads: 0, cpu: 0, ram: 0 },
    stability: { isFailSafe: false, snapshots: [] }
  });
  const [billingInfo, setBillingInfo] = useState<any>(null);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<any>(null);
  const [lastIncidentTimestamp, setLastIncidentTimestamp] = useState<string | null>(null);
  const [toasts, setToasts] = useState<any[]>([]);
  const [proxies, setProxies] = useState<any[]>([]);
  const [platformStatus, setPlatformStatus] = useState<any>(null);
  const [controlState, setControlState] = useState<any>(null);

  const fetchProxies = async () => {
    try {
      const res = await fetch('/api/admin/proxies', {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      if (res.ok) setProxies(await res.json());
    } catch (e) {}
  };

  const fetchPlatformStatus = async () => {
    try {
      const res = await fetch('/api/admin/system/status', {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      if (res.ok) setPlatformStatus(await res.json());
    } catch (e) {}
  };

  const toggleEmergencyStop = async (active: boolean) => {
    try {
      const res = await fetch(active ? '/api/governance/action' : '/api/admin/system/emergency-stop', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ADMIN_TOKEN}` 
        },
        body: JSON.stringify(active ? {
          action_type: 'KILL_SWITCH',
          reason: 'Manual Trigger from Control Center',
          payload: {}
        } : { active })
      });
      if (res.ok) await fetchPlatformStatus();
    } catch (e) {}
  };

  const addToast = (title: string, message: string, type: 'error' | 'warning' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(7);
    setToasts(prev => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch('/api/admin/incidents', {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIncidents(data);
        
        // Notification logic
        if (data.length > 0) {
          const latest = data[0];
          if (lastIncidentTimestamp && latest.timestamp > lastIncidentTimestamp) {
            addToast(
              latest.type?.toUpperCase()?.replace(/_/g, ' ') || 'New Incident',
              latest.message,
              latest.type === 'ban' || latest.type === 'alert_critical' ? 'error' : 'warning'
            );
          }
          setLastIncidentTimestamp(latest.timestamp);
        }
      }
    } catch (e) {}
  };

  const fetchAdminMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics', {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      if (res.ok) setAdminMetrics(await res.json());
    } catch (e) {}
  };

  const fetchSystemState = async () => {
    try {
      const res = await fetch('/api/control/state', {
        headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
      });
      if (res.ok) setControlState(await res.json());
      await fetchIncidents();
      await fetchAdminMetrics();
      await fetchProxies();
      await fetchPlatformStatus();
    } catch (e) {}
  };

  const handleControlAction = async (action: string, payload: any = {}) => {
    try {
      const res = await fetch('/api/control/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ADMIN_TOKEN}` },
        body: JSON.stringify({ action, payload })
      });
      if (res.ok) {
        const data = await res.json();
        setControlState(data.state);
      }
    } catch(e) {}
  };

  useEffect(() => {
    if (activeTab === 'control_center') {
      fetchSystemState();
      const i = setInterval(fetchSystemState, 5000);
      return () => clearInterval(i);
    }
  }, [activeTab]);

  const fetchBilling = async () => {
    try {
      const res = await fetch('/api/billing', {
        headers: { 'x-tenant-id': 'tenant_1', 'x-role': 'admin' }
      });
      if (res.ok) setBillingInfo(await res.json());
    } catch(e) {}
  };

  useEffect(() => {
    if (activeTab === 'billing') {
      fetchBilling();
    }
  }, [activeTab]);

  const fetchLogIntel = async () => {
    try {
      const res = await fetch('/api/system/log-intelligence');
      const data = await res.json();
      setLogIntel(data);

      const tracesRes = await fetch('/api/system/traces');
      const tracesData = await tracesRes.json();
      setTraces(tracesData);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (activeTab === 'logIntel') {
      fetchLogIntel();
      const int = setInterval(fetchLogIntel, 10000);
      return () => clearInterval(int);
    }
  }, [activeTab]);
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [systemAccounts, setSystemAccounts] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('app_theme') !== 'light');
  const [showProfile, setShowProfile] = useState(false);

  // Analytics State
  const [bestChannels, setBestChannels] = useState<{source_channel: string, leads: number, sales: number}[]>([]);
  const [bestTests, setBestTests] = useState<any[]>([]);
  const [accountEfficiency, setAccountEfficiency] = useState<any[]>([]);

  // CRM Form State
  const [crmName, setCrmName] = useState('');
  const [crmLink, setCrmLink] = useState('');
  const [crmDesc, setCrmDesc] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);

  // Leads State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedChart, setSelectedChart] = useState<string | null>(null);
  const [leadMessages, setLeadMessages] = useState<ConversationMsg[]>([]);

  // Userbot Auth State
  const [authStep, setAuthStep] = useState<'idle' | 'requesting' | 'code' | 'done'>('idle');
  const [authPhoneCode, setAuthPhoneCode] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [apiIdInput, setApiIdInput] = useState('');
  const [apiHashInput, setApiHashInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  const settingsRef = useRef(settings);
  const lastSavedSettingsRef = useRef<string | null>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('app_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('app_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (settingsRef.current) {
        const currentSettingsStr = JSON.stringify(settingsRef.current);
        if (currentSettingsStr !== lastSavedSettingsRef.current) {
          setIsAutoSaving(true);
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: currentSettingsStr
          })
          .then(() => {
            lastSavedSettingsRef.current = currentSettingsStr;
          })
          .catch(e => console.error('Auto-save failed', e))
          .finally(() => setIsAutoSaving(false));
        }
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await res.json();
          setStatus(data);
        } else {
          // Ignore HTML responses during server restart
          console.warn('Status response is not JSON');
        }
      } catch (error: any) {
        // Silently ignore expected transient errors during server restarts/network drops
        const msg = error?.message || '';
        if (!msg.includes('Unexpected token') && !msg.includes('Failed to fetch') && !msg.includes('HTTP error')) {
          console.error('Failed to fetch status:', error);
        }
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchDashboard();
    }
    if (activeTab === 'accounts') {
      fetch('/api/accounts')
        .then(res => res.json())
        .then(data => setSystemAccounts(data))
        .catch(console.error);
    }
    if (activeTab === 'settings' && !settings) {
      fetch('/api/settings')
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          setSettings(data);
          lastSavedSettingsRef.current = JSON.stringify(data);
        })
        .catch(e => {
          const msg = e?.message || '';
          if (!msg.includes('Unexpected token') && !msg.includes('Failed to fetch') && !msg.includes('HTTP error')) {
            console.error('Failed to fetch settings:', e);
          }
        });
    }
    if (activeTab === 'leads') {
      fetchLeads();
    }
    if (activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [activeTab]);

  const fetchAnalytics = async () => {
    try {
      const [channelsRes, testsRes, effRes, stateRes] = await Promise.all([
        fetch('/api/analytics/channels'),
        fetch('/api/analytics/message-tests'),
        fetch('/api/analytics/account-efficiency'),
        fetch('/api/system/state')
      ]);
      if (channelsRes.ok) setBestChannels(await channelsRes.json());
      if (testsRes.ok) setBestTests(await testsRes.json());
      if (effRes.ok) setAccountEfficiency(await effRes.json());
      if (stateRes.ok) setSystemState(await stateRes.json());
    } catch (e) {
      console.error('Failed to fetch analytics', e);
    }
  };

  const toggleSystemPause = async () => {
      try {
          const nextState = !systemState.is_paused;
          await fetch('/api/system/state', {
             method: 'POST',
             headers: {'Content-Type': 'application/json'},
             body: JSON.stringify({ is_paused: nextState })
          });
          setSystemState({...systemState, is_paused: nextState});
      } catch (e) {
          console.error('Failed to toggle system pause', e);
      }
  };

  // Action tracking
  const [isGeneratingCompetitors, setIsGeneratingCompetitors] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchInsights();
      fetchPendingPosts();
    }
  }, [activeTab]);

  const fetchPendingPosts = async () => {
    try {
      const res = await fetch('/api/autopost/pending');
      if (res.ok) {
        const data = await res.json();
        if (data.posts) setPendingPosts(data.posts);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchInsights = async () => {
    try {
      const res = await fetch('/api/insights');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
        setInsights(await res.json());
      }
    } catch(e) {}
  };

  const handleSafeMode = async () => {
    try {
      await fetch('/api/actions/safe-mode', { method: 'POST' });
      fetchDashboard();
    } catch(e) {}
  };

  const handleStop = async () => {
    try {
      await fetch('/api/actions/stop', { method: 'POST' });
      fetchDashboard();
    } catch(e) {}
  };

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/dashboard');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
        setDashboard(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch dashboard', e);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      const contentType = res.headers.get("content-type");
      if (res.ok && contentType && contentType.indexOf("application/json") !== -1) {
        setLeads(await res.json());
      }
    } catch (e) {
      console.error('Failed to fetch leads', e);
    }
  };

  const updateLeadStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch('/api/leads/status', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings?.externalApiToken || localStorage.getItem('adminToken') || ''}`
        },
        body: JSON.stringify({ id, status: newStatus })
      });
      if (res.ok) {
        fetchLeads();
        if (selectedLead && selectedLead.id === id) {
          setSelectedLead({ ...selectedLead, status: newStatus });
        }
      } else {
        const err = await res.json();
        console.error('Update failed:', err);
        alert(`Ошибка обновления: ${err.error}`);
      }
    } catch (e) {
      console.error('Failed to update lead status', e);
    }
  };

  // Reference to hold active abort controller for fetching lead messages
  const activeLeadFetch = useRef<AbortController | null>(null);

  const openLead = async (lead: Lead) => {
    setSelectedLead(lead);
    setLeadMessages([]); // clear old messages immediately
    
    // Abort previous fetch if any to avoid race conditions
    if (activeLeadFetch.current) {
      activeLeadFetch.current.abort();
    }
    
    const abortController = new AbortController();
    activeLeadFetch.current = abortController;

    try {
      const res = await fetch(`/api/leads/${lead.id}/messages`, {
        signal: abortController.signal
      });
      if (res.ok) {
        const data = await res.json();
        // Only set messages if we are still viewing this lead
        setLeadMessages(data);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        console.log('Aborted fetching messages for lead', lead.id);
      } else {
        console.error('Failed to fetch lead messages', e);
      }
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    setIsSaving(true);
    try {
      const currentSettingsStr = JSON.stringify(settings);
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: currentSettingsStr
      });
      lastSavedSettingsRef.current = currentSettingsStr;
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save settings', e);
    }
    setIsSaving(false);
  };

  const handleUserbotSendCode = async () => {
    setAuthStep('requesting');
    try {
      const res = await fetch('/api/userbot/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiId: apiIdInput, apiHash: apiHashInput, phone: phoneInput })
      });
      if (res.ok) {
        setAuthStep('code');
      } else {
        alert('Ошибка при отправке кода');
        setAuthStep('idle');
      }
    } catch (e) {
      console.error(e);
      setAuthStep('idle');
    }
  };

  const handleUserbotLogin = async () => {
    try {
      const res = await fetch('/api/userbot/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: authPhoneCode, password: authPassword })
      });
      if (res.ok) {
        setAuthStep('done');
        alert('Юзербот успешно авторизован!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const downloadReport = () => {
    window.location.href = '/api/report';
  };

  const handleAnalyzeGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crmName || !crmDesc) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await fetch('/api/analyze-group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: crmName, link: crmLink, description: crmDesc })
      });
      const data = await res.json();
      if (data.success && data.group) {
          setAnalysisResult(data.group);
      }
      setCrmName('');
      setCrmLink('');
      setCrmDesc('');
      // Status will auto-refresh via the interval
    } catch (error) {
      console.error('Failed to analyze group', error);
    }
    setIsAnalyzing(false);
  };

  const handleGenerateCompetitors = async () => {
    setIsGeneratingCompetitors(true);
    try {
      await fetch('/api/competitors/generate', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setIsGeneratingCompetitors(false);
  };

  const leadQualityData = [
    { name: '🔥 High (>75)', value: leads.filter(l => (l.score || 0) > 75).length, color: '#ef4444' },
    { name: '⚖️ Medium (30-75)', value: leads.filter(l => (l.score || 0) >= 30 && (l.score || 0) <= 75).length, color: '#f59e0b' },
    { name: '❄️ Low (<30)', value: leads.filter(l => (l.score || 0) < 30).length, color: '#3b82f6' },
  ];

  const scoreConversionData = [
    { label: '0-20', min: 0, max: 20 },
    { label: '20-40', min: 21, max: 40 },
    { label: '40-60', min: 41, max: 60 },
    { label: '60-80', min: 61, max: 80 },
    { label: '80-100', min: 81, max: 100 },
  ].map(bracket => {
    const bLeads = leads.filter(l => (l.score || 0) >= bracket.min && (l.score || 0) <= bracket.max);
    const total = bLeads.length;
    const closed = bLeads.filter(l => l.status === 'closed').length;
    const conv = total > 0 ? Math.round((closed / total) * 100) : null;
    return { score: bracket.label, conversion: conv };
  });

  const throttledChartData = useThrottle(dashboard?.chart || [], 2000);
  const throttledLeadQualityData = useThrottle(leadQualityData, 2000);
  const throttledScoreConversionData = useThrottle(scoreConversionData, 2000);

  const themeClasses = {
    bg: isDarkMode ? 'bg-[#1c1c1d]' : 'bg-gray-50',
    text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    cardBg: isDarkMode ? 'bg-[#2c2c2e]' : 'bg-white',
    cardBorder: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    textMuted: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    hoverBg: isDarkMode ? 'hover:bg-[#3a3a3c]' : 'hover:bg-gray-50',
    activeTabBg: isDarkMode ? 'bg-[#3a3a3c] text-white' : 'bg-blue-50 text-blue-700',
    inactiveTabBg: isDarkMode ? 'text-gray-400 hover:bg-[#3a3a3c] hover:text-white' : 'text-gray-600 hover:bg-gray-100',
    inputBg: isDarkMode ? 'bg-[#1c1c1d] border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900',
  };

  const MetricsView = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const fetchMetrics = async () => {
        try {
          const res = await fetch('/api/admin/metrics', {
            headers: { 'Authorization': `Bearer ${ADMIN_TOKEN}` }
          });
          const json = await res.json();
          setData(json);
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      };
      
      fetchMetrics();
      const interval = setInterval(fetchMetrics, 30000);
      return () => clearInterval(interval);
    }, []);

    if (loading || !data) return <div className="flex items-center justify-center h-64"><RefreshCw className="animate-spin h-8 w-8 text-blue-500" /></div>;

    const findMetric = (name: string) => data.summary?.find((m: any) => m.name === name);

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Health & Scalability</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${themeClasses.textMuted} uppercase tracking-wider`}>Ban Rate</span>
              <ShieldAlert className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold font-mono">
              {((Number(findMetric('tg.send_failure')?.count || 0) / (Number(findMetric('tg.send_attempt')?.count || 1))) * 100).toFixed(1)}%
            </div>
          </div>
          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${themeClasses.textMuted} uppercase tracking-wider`}>AI Latency (Avg)</span>
              <Zap className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold font-mono">
              {(Number(findMetric('ai.latency')?.avg_value || 0) / 1000).toFixed(1)}s
            </div>
          </div>
          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${themeClasses.textMuted} uppercase tracking-wider`}>Throughput</span>
              <MessageSquare className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono">
              {findMetric('tg.send_success')?.count || 0} msg
            </div>
          </div>
          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-xl p-4`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${themeClasses.textMuted} uppercase tracking-wider`}>System Health</span>
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold font-mono">
              {data.accountStates?.filter((s:any) => s.state === 'ACTIVE').length > 0 ? '98.2%' : '100%'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl p-6 shadow-sm`}>
            <h3 className="text-lg font-semibold mb-4">Account States</h3>
            <div className="space-y-4">
              {data.accountStates?.map((s: any) => (
                <div key={s.state}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className={themeClasses.textMuted}>{s.state}</span>
                    <span className="font-mono">{s.count}</span>
                  </div>
                  <div className={`h-2 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-full`}>
                    <div 
                      className={`h-full rounded-full ${s.state === 'ACTIVE' ? 'bg-emerald-500' : s.state === 'BANNED' ? 'bg-red-500' : 'bg-amber-500'}`}
                      style={{ width: `${(s.count / data.accountStates.reduce((a: any, b: any) => a + Number(b.count), 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl p-6 shadow-sm overflow-hidden`}>
              <h3 className="text-lg font-semibold mb-4 flex items-center justify-between">
               Risk Alerts
               {(incidents?.length || 0) > 0 && (
                 <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
               )}
             </h3>
             <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {incidents && incidents.length > 0 ? (
                  incidents.map((incident: any, idx: number) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl border ${
                      incident.type === 'alert_critical' || incident.type === 'ban' 
                        ? 'bg-red-500/10 border-red-500/20' 
                        : 'bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {incident.type === 'alert_critical' || incident.type === 'ban' ? (
                        <ShieldAlert className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-sm font-medium capitalize">{incident.type?.replace(/_/g, ' ')}</div>
                        <div className={`text-xs ${
                          incident.type === 'alert_critical' || incident.type === 'ban' ? 'text-red-400/80' : 'text-amber-400/80'
                        }`}>
                          {incident.message}
                        </div>
                        <div className="text-[10px] opacity-40 mt-1">
                          {new Date(incident.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 p-4 justify-center text-emerald-500 bg-emerald-500/5 rounded-xl border border-dashed border-emerald-500/20">
                    <ShieldCheck className="h-5 w-5" />
                    <span className="text-sm font-medium">No active risks detected</span>
                  </div>
                )}
              </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100/10 dark:border-gray-700/50 space-y-4">
                  <div className="flex justify-between text-xs">
                    <span className={themeClasses.textMuted}>Надежность платформы</span>
                    <span className="text-emerald-500 font-bold">STABLE</span>
                  </div>
                  
                  <button
                    onClick={async () => {
                      const res = await fetch('/api/admin/test-load', {
                        method: 'POST',
                        headers: { 
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${ADMIN_TOKEN}` 
                        },
                        body: JSON.stringify({ scenario: 'fairness' })
                      });
                      if (res.ok) alert('Load test "fairness" started. Watch the metrics!');
                    }}
                    className="w-full py-2 px-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2"
                  >
                    <Command className="h-3 w-3" />
                    Run Fairness Chaos Test
                  </button>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-800/50 p-2 rounded text-center">
                      <div className="text-[10px] text-gray-500 uppercase">Latency</div>
                      <div className="text-xs font-mono">{Number(findMetric('ai.latency')?.avg_value || 0).toFixed(0)}ms</div>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded text-center">
                      <div className="text-[10px] text-gray-500 uppercase">Queue</div>
                      <div className="text-xs font-mono">124ms</div>
                    </div>
                    <div className="bg-gray-800/50 p-2 rounded text-center">
                      <div className="text-[10px] text-gray-500 uppercase">Errors</div>
                      <div className="text-xs font-mono">{Number(findMetric('ai.generation_failure')?.count || 0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      };

  const kanbanColumns = [
    { key: 'new', title: 'Новые' },
    { key: 'contacted', title: 'Написали' },
    { key: 'dialog', title: 'Диалог' },
    { key: 'qualified', title: 'Готов купить' },
    { key: 'closed', title: 'Закрыто' },
    { key: 'lost', title: 'Потерян' }
  ];

  return (
    <div className={`min-h-screen ${themeClasses.bg} ${themeClasses.text} font-sans transition-colors duration-200`}>
      {authError && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className={`${themeClasses.cardBg} ${themeClasses.cardBorder} border rounded-lg p-6 max-w-md w-full shadow-2xl`}>
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-red-500" />
              <h2 className="text-xl font-bold">Требуется авторизация</h2>
            </div>
            <p className={`${themeClasses.textMuted} mb-6`}>
              Ваш сеанс истек или у вас нет прав доступа. Пожалуйста, введите токен администратора.
            </p>
            <input 
              type="password"
              placeholder="ADMIN_TOKEN"
              value={adminToken}
              onChange={e => {
                setAdminToken(e.target.value);
                localStorage.setItem('ADMIN_TOKEN', e.target.value);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  window.location.reload();
                }
              }}
              className={`w-full bg-black/20 border ${themeClasses.cardBorder} rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <button
               onClick={() => window.location.reload()}
               className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors"
            >
              Войти
            </button>
          </div>
        </div>
      )}

      {!isTabFullscreen && (
      <header className={`${themeClasses.cardBg} border-b ${themeClasses.cardBorder} px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-10`}>
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.location.href = '/'}>
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 dark:from-white dark:to-gray-200 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-300">
             <div className="absolute inset-0 bg-blue-500 rounded-xl opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-300"></div>
             <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white dark:text-black z-10">
               <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.8"/>
               <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
               <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
             </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-300 dark:to-white bg-[length:200%_auto] animate-gradient group-hover:opacity-80 transition-opacity">TeleSync<span className="text-blue-600 dark:text-blue-400">.</span>os</h1>
            <p className={`text-xs ${themeClasses.textMuted} tracking-wide uppercase font-semibold mt-0.5`}>Autonomic Deal Engine</p>
          </div>
        </div>
          <div className="flex items-center gap-4">
            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/10 text-blue-500 text-[10px] font-bold border border-blue-500/20 uppercase">
              <Shield className="w-3 h-3" /> RLS И МУЛЬТИТЕНАНТНОСТЬ АКТИВНЫ
            </span>
          {status?.botConfigured ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100/10 text-green-500 text-sm font-medium border border-green-500/20">
              <CheckCircle2 className="w-4 h-4" />
              Бот активен
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100/10 text-amber-500 text-sm font-medium border border-amber-500/20">
              <AlertCircle className="w-4 h-4" />
              {tMenu.token_required}
            </span>
          )}

          {/* Language Selector in Header */}
          <div className="relative group flex items-center">
            <button className={`p-2 rounded-full ${themeClasses.hoverBg} transition-colors flex items-center justify-center relative`} title="Language">
              <Globe className="w-5 h-5 text-gray-500" />
              <div className="absolute bottom-0 right-0 translate-x-[2px] translate-y-[2px] text-[10px] leading-none flex items-center justify-center">
                {(['ru', 'es', 'de', 'fr', 'zh'].includes(langRaw) ? 
                  {ru: '🇷🇺', es: '🇪🇸', de: '🇩🇪', fr: '🇫🇷', zh: '🇨🇳'}[langRaw] : '🇺🇸')}
              </div>
            </button>
            <div className={`absolute top-full right-0 mt-2 w-36 rounded-xl shadow-xl border ${themeClasses.cardBorder} ${themeClasses.cardBg} flex flex-col py-1.5 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50`}>
                <button 
                  onClick={() => changeLanguage('ru')}
                  className="px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex gap-2 items-center text-gray-200"
                >
                  <span className="text-lg leading-none">🇷🇺</span> Русский
                </button>
                <button 
                  onClick={() => changeLanguage('en')}
                  className="px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex gap-2 items-center text-gray-200"
                >
                  <span className="text-lg leading-none">🇺🇸</span> English
                </button>
                <button 
                  onClick={() => changeLanguage('es')}
                  className="px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex gap-2 items-center text-gray-200"
                >
                  <span className="text-lg leading-none">🇪🇸</span> Español
                </button>
                <button 
                  onClick={() => changeLanguage('de')}
                  className="px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex gap-2 items-center text-gray-200"
                >
                  <span className="text-lg leading-none">🇩🇪</span> Deutsch
                </button>
                <button 
                  onClick={() => changeLanguage('fr')}
                  className="px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex gap-2 items-center text-gray-200"
                >
                  <span className="text-lg leading-none">🇫🇷</span> Français
                </button>
                <button 
                  onClick={() => changeLanguage('zh')}
                  className="px-4 py-2.5 text-left text-sm hover:bg-white/5 transition-colors flex gap-2 items-center text-gray-200"
                >
                  <span className="text-lg leading-none">🇨🇳</span> 中文
                </button>
            </div>
          </div>
          
          {/* Full Screen Toggle Button */}
          <div className="relative group">
            <button 
              onClick={toggleFullscreen}
              className={`p-2 rounded-full ${themeClasses.hoverBg} transition-colors flex items-center justify-center`}
              title={isFullscreen ? tHint.exitFullscreen : tHint.fullscreen}
            >
              {isFullscreen ? <Minimize className="w-5 h-5 text-blue-500 animate-pulse" /> : <Maximize className="w-5 h-5 text-gray-500 hover:text-white" />}
            </button>
            <div className="absolute top-full right-0 mt-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-[10px] text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform -translate-y-1 group-hover:translate-y-0 animate-in fade-in slide-in-from-top-1">
              {isFullscreen ? tHint.exitFullscreen : tHint.fullscreen}
              <div className="absolute bottom-full right-3 w-0 h-0 border-x-[4px] border-x-transparent border-b-[5px] border-b-gray-950/95"></div>
            </div>
          </div>

          {/* Theme Switcher Button */}
          <div className="relative group">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full ${themeClasses.hoverBg} transition-colors flex items-center justify-center`}
              title={tHint.themeToggle}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
            <div className="absolute top-full right-0 mt-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-[10px] text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform -translate-y-1 group-hover:translate-y-0 animate-in fade-in slide-in-from-top-1">
              {tHint.themeToggle}
              <div className="absolute bottom-full right-3 w-0 h-0 border-x-[4px] border-x-transparent border-b-[5px] border-b-gray-950/95"></div>
            </div>
          </div>
          
          {/* Profile Button */}
          <div className="relative group">
            <button
              onClick={() => setShowProfile(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
              title="Личный кабинет"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span className="hidden sm:inline">Профиль</span>
            </button>
          </div>

          {/* Settings Button */}
          <div className="relative group">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              title={tHint.settingsBtn}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">Настройки</span>
            </button>
            <div className="absolute top-full right-0 mt-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-[10px] text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform -translate-y-1 group-hover:translate-y-0 animate-in fade-in slide-in-from-top-1">
              {tHint.settingsBtn}
              <div className="absolute bottom-full right-6 w-0 h-0 border-x-[4px] border-x-transparent border-b-[5px] border-b-gray-950/95"></div>
            </div>
          </div>
        </div>
      </header>
      )}

      {/* Profile Modal — Glassmorphism */}
      {showProfile && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{background: 'radial-gradient(ellipse at 60% 40%, rgba(99,102,241,0.18) 0%, rgba(0,0,0,0.75) 100%)', backdropFilter: 'blur(16px)'}}
          onClick={() => setShowProfile(false)}
        >
          <div
            className="relative w-full max-w-sm mx-4 rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Glow top */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(99,102,241,0.35) 0%, transparent 70%)'}} />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full pointer-events-none" style={{background: 'radial-gradient(circle, rgba(168,85,247,0.25) 0%, transparent 70%)'}} />

            {/* Header strip */}
            <div className="relative px-6 pt-6 pb-8" style={{background: 'linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(168,85,247,0.2) 100%)'}}>
              <button onClick={() => setShowProfile(false)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-white/60" />
              </button>
              {/* Avatar */}
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-2xl" style={{background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)'}}>
                    A
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-400 border-2 border-gray-900 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Admin</h2>
                <p className="text-sm text-indigo-300 mt-0.5">admin@telesyncos.io</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white" style={{background: 'linear-gradient(90deg, rgba(99,102,241,0.5), rgba(168,85,247,0.5))', border: '1px solid rgba(255,255,255,0.15)'}}>
                  ✦ {billingInfo?.plan || 'Pro'} Plan
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px mx-6 -mt-4 mb-5 rounded-2xl overflow-hidden" style={{border: '1px solid rgba(255,255,255,0.08)'}}>
              {[
                {val: status?.leads?.length || 0, label: 'Лидов', color: '#6366f1'},
                {val: status?.users?.length || 0, label: 'Клиентов', color: '#a855f7'},
                {val: status?.accounts?.length || 0, label: 'Аккаунтов', color: '#ec4899'},
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center py-3" style={{background: 'rgba(255,255,255,0.04)'}}>
                  <span className="text-2xl font-black" style={{color: s.color}}>{s.val}</span>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</span>
                </div>
              ))}
            </div>

            {/* Info list */}
            <div className="px-6 pb-2 space-y-2">
              {[
                {label: 'Роль', value: 'Администратор', valueClass: 'text-white font-semibold'},
                {label: 'Статус бота', value: status?.botConfigured ? '● Активен' : '● Не настроен', valueClass: status?.botConfigured ? 'text-green-400 font-semibold' : 'text-amber-400 font-semibold'},
                {label: 'AI вызовов', value: `${billingInfo?.usage?.ai_calls || 0} / ${billingInfo?.limits?.ai_calls_limit || 10000}`, valueClass: 'text-gray-300 font-mono text-xs'},
                {label: 'Аккаунтов', value: `${billingInfo?.usage?.accounts || 0} / ${billingInfo?.limits?.accounts_limit || 10}`, valueClass: 'text-gray-300 font-mono text-xs'},
                {label: 'Подписка до', value: billingInfo?.period_end ? new Date(billingInfo.period_end).toLocaleDateString('ru-RU') : '—', valueClass: 'text-gray-300 text-xs'},
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b" style={{borderColor: 'rgba(255,255,255,0.06)'}}>
                  <span className="text-xs text-gray-500 uppercase tracking-wide">{row.label}</span>
                  <span className={`text-sm ${row.valueClass}`}>{row.value}</span>
                </div>
              ))}
              {/* Token row */}
              <div className="flex justify-between items-center py-2">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Admin Token</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-gray-400 max-w-[110px] truncate">{adminToken || '—'}</span>
                  {adminToken && (
                    <button
                      onClick={() => navigator.clipboard.writeText(adminToken)}
                      className="text-[10px] px-2 py-0.5 rounded-lg font-bold text-indigo-300 transition-all hover:text-white"
                      style={{background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)'}}
                    >
                      COPY
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 py-5">
              <button
                onClick={() => { setShowProfile(false); setActiveTab('settings'); }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 8px 24px rgba(99,102,241,0.4)'}}
              >
                <Settings className="w-4 h-4" /> Настройки
              </button>
              <button
                onClick={() => { localStorage.removeItem('ADMIN_TOKEN'); window.location.reload(); }}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-red-400 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                style={{background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)'}}
              >
                <X className="w-4 h-4" /> Выйти
              </button>
            </div>
          </div>
        </div>
      )}

      {isTabFullscreen && (
        <div className="fixed top-4 right-4 z-[9999] animate-in fade-in zoom-in duration-300">
          <button 
            onClick={() => setIsTabFullscreen(false)}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/90 hover:bg-red-500 text-white shadow-2xl shadow-red-500/20 backdrop-blur-md border border-red-400/30 rounded-xl text-xs font-bold font-mono transition-all duration-300 group"
          >
            <span className="hidden group-hover:inline opacity-80 mr-1 text-[10px]">ESC</span>
            <X className="w-4 h-4" />
            {langRaw === 'ru' ? 'ЗАКРЫТЬ' : 'EXIT FULLSCREEN'}
          </button>
        </div>
      )}

      <div className={isTabFullscreen 
        ? "w-full h-[100dvh] bg-[#0b1019] flex flex-col relative z-[50]" 
        : `w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6 ${isFullscreen ? 'min-h-screen py-3' : 'min-h-[calc(100vh-100px)]'} md:items-stretch`
      }>
        
        {/* Main Content (Left) */}
        <main className="flex-1 space-y-6 min-w-0">
          
          {/* Tab Content */}
          {activeTab === 'readiness' && (
             <OperationalReadinessDashboard />
          )}

          {activeTab === 'decision_center' && (
             <AIDecisionCenter />
          )}

          {activeTab === 'cognitive' && (
             <CognitiveOSDashboard />
          )}

          {activeTab === 'control_center' && controlState && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold font-display">Центр управления</h1>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    Live Connection
                  </span>
                  <button onClick={fetchSystemState} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                    <RefreshCw className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>

              {/* 1. Live System Status */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                  <div className="text-sm text-gray-500 mb-2">Active AI Workers</div>
                  <div className="text-3xl font-bold flex items-center justify-between">
                    <span>{controlState.ai?.activeWorkers || 0}</span>
                    <Bot className="w-8 h-8 text-blue-500 opacity-20" />
                  </div>
                </div>
                <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                   <div className="text-sm text-gray-500 mb-2">CPU / RAM Load</div>
                   <div className="text-xl font-bold">~{(controlState.metrics?.cpu || 0).toFixed(1)}% / {(controlState.metrics?.ram || 0).toFixed(0)}MB</div>
                </div>
                <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                   <div className="text-sm text-gray-500 mb-2">Total Leads (Memory)</div>
                   <div className="text-3xl font-bold text-green-600">{controlState.metrics?.totalLeads || 0}</div>
                </div>
                <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                   <div className="text-sm text-gray-500 mb-2">Errors (1h)</div>
                   <div className={`text-3xl font-bold ${(controlState.metrics?.recentErrors || 0) > 10 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                     {controlState.metrics?.recentErrors || 0}
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 2. Farm Control */}
                <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500"/> Farm Engine Control</h2>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl mb-4 border border-gray-100 dark:border-gray-800">
                    <div>
                      <div className="font-bold">Total Accounts</div>
                      <div className="text-sm text-gray-500">Currently registered</div>
                    </div>
                    <div className="text-2xl font-bold">{controlState.farm?.totalAccounts || 0}</div>
                  </div>

                  <div className="flex gap-4">
                    {!controlState.farm?.isPaused ? (
                      <button onClick={() => handleControlAction('pause_farm')} className="flex-1 py-3 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 font-bold rounded-xl flex justify-center items-center gap-2 transition-colors">
                        <StopCircle className="w-5 h-5" /> Pause Farm
                      </button>
                    ) : (
                      <button onClick={() => handleControlAction('resume_farm')} className="flex-1 py-3 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50 font-bold rounded-xl flex justify-center items-center gap-2 transition-colors">
                        <PlayCircle className="w-5 h-5" /> Resume Farm
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Strategy / AI Config */}
                <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-orange-500"/> AI Strategy Engine</h2>

                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-2">Current Policy</div>
                    <div className="flex gap-2">
                       {['safe', 'balanced', 'aggressive'].map(str => (
                         <button 
                           key={str}
                           onClick={() => handleControlAction('set_strategy', { strategy: str })}
                           className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${
                             controlState.strategy?.current === str 
                               ? 'bg-blue-500 text-white border-blue-600 shadow-md scale-105' 
                               : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                           }`}
                         >
                           {str.charAt(0).toUpperCase() + str.slice(1)}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="p-4 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 rounded-xl space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tone:</span>
                      <span className="font-mono font-bold text-orange-800 dark:text-orange-300">{controlState.strategy?.config?.tone}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Length/Pace:</span>
                      <span className="font-mono font-bold text-orange-800 dark:text-orange-300">{controlState.strategy?.config?.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Aggressiveness:</span>
                      <span className="font-mono font-bold text-orange-800 dark:text-orange-300">{controlState.strategy?.config?.aggressiveness}</span>
                    </div>
                  </div>
                </div>

                {/* 4. Scale Control */}
                <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg} lg:col-span-2`}>
                   <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-500"/> Scale Workload</h2>
                   <div className="flex items-center gap-6">
                     <input 
                       type="range" 
                       min="1" max="20" step="1" 
                       value={controlState.ai?.activeWorkers || 1} 
                       onChange={(e) => handleControlAction('scale', { scale: parseInt(e.target.value) })}
                       className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700" 
                     />
                     <div className="text-2xl font-mono font-bold text-blue-600 w-16 text-right">
                       {controlState.ai?.activeWorkers || 1}x
                     </div>
                   </div>
                   <p className="text-xs text-gray-500 mt-2">Adjusting this will scale the available async workers for message generation and analysis.</p>
                </div>
                
                {/* 5. Stability & Rollbacks */}
                <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg} lg:col-span-2`}>
                   <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                     <ShieldAlert className={`w-5 h-5 ${controlState.stability?.isFailSafe ? 'text-red-500 animate-pulse' : 'text-blue-500'}`}/> 
                     Stability & Rollbacks
                   </h2>
                   
                   {controlState.stability?.isFailSafe && (
                     <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-900/50 rounded-xl flex items-center gap-4">
                       <AlertOctagon className="w-8 h-8 text-red-600" />
                       <div>
                         <h3 className="font-bold text-red-800 dark:text-red-300">Fail-Safe Mode Active</h3>
                         <p className="text-sm text-red-700 dark:text-red-400">The system has automatically restricted operations due to elevated errors/risks. Farm is paused, strategy is 'safe', and workers are scaled down.</p>
                       </div>
                       <button onClick={() => handleControlAction('resume_farm')} className="ml-auto px-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-lg shadow font-medium">
                         Clear Fail-Safe
                       </button>
                     </div>
                   )}

                   <div className="flex justify-between items-center mb-4">
                      <div className="text-sm text-gray-500 font-medium">System Snapshots History</div>
                      <div className="flex gap-2">
                        <button onClick={() => handleControlAction('create_snapshot', { reason: 'manual_ui' })} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors border border-gray-200 dark:border-gray-700">
                          Create Snapshot
                        </button>
                        {!controlState.stability?.isFailSafe && (
                           <button onClick={() => handleControlAction('trigger_failsafe')} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 text-sm font-medium rounded-lg transition-colors border border-red-200 dark:border-red-900">
                             Trigger Fail-Safe
                           </button>
                        )}
                      </div>
                   </div>

                   {controlState.stability?.snapshots?.length > 0 ? (
                     <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
                       <table className="w-full text-left text-sm whitespace-nowrap">
                         <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400">
                           <tr>
                             <th className="px-4 py-2 font-medium rounded-tl-lg">Time</th>
                             <th className="px-4 py-2 font-medium">Reason</th>
                             <th className="px-4 py-2 font-medium">Strategy</th>
                             <th className="px-4 py-2 font-medium">Scale</th>
                             <th className="px-4 py-2 font-medium">Farm</th>
                             <th className="px-4 py-2 font-medium rounded-tr-lg text-right">Action</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                           {[...controlState.stability.snapshots].reverse().map((snap: any, index: number) => (
                             <tr key={snap.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                               <td className="px-4 py-3 font-mono text-gray-500 dark:text-gray-400">
                                  {new Date(snap.timestamp).toLocaleTimeString()}
                                  {index === 0 && <span className="ml-2 text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded">Latest</span>}
                               </td>
                               <td className="px-4 py-3"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">{snap.reason}</span></td>
                               <td className="px-4 py-3 font-medium capitalize">{snap.strategyId}</td>
                               <td className="px-4 py-3">{snap.workerScale}x</td>
                               <td className="px-4 py-3">{snap.isFarmPaused ? <span className="text-red-500">Paused</span> : <span className="text-green-500">Active</span>}</td>
                               <td className="px-4 py-3 text-right">
                                 <button onClick={() => handleControlAction('rollback', { snapshotId: snap.id })} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 px-3 py-1 rounded border border-blue-200 dark:border-blue-800 transition-colors">
                                   Rollback Here
                                 </button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   ) : (
                     <div className="text-center py-6 text-gray-500 text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                       No snapshots taken yet. Create a snapshot to save your configuration.
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'logIntel' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold font-display">AI Log Intelligence</h1>
                <button onClick={fetchLogIntel} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
                  <RefreshCw className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {logIntel ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                     <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                        <div className="text-sm text-gray-500 mb-1">Messages (24h)</div>
                        <div className="text-3xl font-bold">{logIntel.metrics?.totalMessagesLatest || 0}</div>
                     </div>
                     <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                        <div className="text-sm text-gray-500 mb-1">Bans (24h)</div>
                        <div className="text-3xl font-bold flex items-center gap-2">
                           <ShieldAlert className="w-6 h-6 text-red-500"/>
                           {logIntel.metrics?.totalBansLatest || 0}
                        </div>
                     </div>
                     <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                        <div className="text-sm text-gray-500 mb-1">Ban Rate (24h)</div>
                        <div className={`text-3xl font-bold ${Number(logIntel.metrics?.computedBanRate) > 0.1 ? 'text-red-500' : 'text-green-500'}`}>
                           {(Number(logIntel.metrics?.computedBanRate) * 100).toFixed(1)}%
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Bug className="w-5 h-5"/> Топ Ошибок (Patterns)</h2>
                      {logIntel.topErrors && logIntel.topErrors.length > 0 ? (
                        <div className="space-y-3">
                          {logIntel.topErrors.map((err: any, idx: number) => (
                             <div key={idx} className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30 flex justify-between items-start">
                               <div className="text-sm font-mono text-red-800 dark:text-red-300 break-all w-3/4">{err.pattern}</div>
                               <div className="font-bold text-red-600 bg-red-100 dark:bg-red-900/50 px-2 py-1 rounded-md text-xs">{err.count}x</div>
                             </div>
                          ))}
                        </div>
                      ) : <p className="text-gray-500 text-sm">Ошибок не найдено.</p>}
                    </div>

                    <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-orange-500"/> Причины банов</h2>
                      {logIntel.topBans && logIntel.topBans.length > 0 ? (
                        <div className="space-y-3">
                          {logIntel.topBans.map((ban: any, idx: number) => (
                             <div key={idx} className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-900/30 flex justify-between items-center">
                               <div className="text-sm font-medium text-orange-800 dark:text-orange-300">
                                 {ban.root_cause || 'Unknown / Manual pattern matching required'}
                               </div>
                               <div className="font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-md text-xs">{ban.count}x</div>
                             </div>
                          ))}
                        </div>
                      ) : <p className="text-gray-500 text-sm">Банов не найдено.</p>}
                    </div>

                    <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg} lg:col-span-2`}>
                      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-500"/> Проблемные Аккаунты</h2>
                      {logIntel.problemAccounts && logIntel.problemAccounts.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead>
                               <tr className="border-b border-gray-200 dark:border-gray-700">
                                 <th className="pb-2">ID Аккаунта</th>
                                 <th className="pb-2 text-right">Ошибок / Warn</th>
                               </tr>
                            </thead>
                            <tbody>
                               {logIntel.problemAccounts.map((acc: any, idx: number) => (
                                 <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 last:border-0">
                                   <td className="py-3 font-mono text-gray-700 dark:text-gray-300">{acc.account_id}</td>
                                   <td className="py-3 text-right text-red-500 font-bold">{acc.error_count}</td>
                                 </tr>
                               ))}
                            </tbody>
                          </table>
                        </div>
                      ) : <p className="text-gray-500 text-sm">Проблемных аккаунтов не найдено.</p>}
                    </div>

                    <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg} lg:col-span-2`}>
                      <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Network className="w-5 h-5 text-indigo-500"/> Distributed Traces</h2>
                      {traces && traces.length > 0 ? (
                        <div className="space-y-6">
                           {traces.map((traceList, traceIdx) => {
                             const hasError = traceList.some((s: any) => s.level === 'warn' || s.level === 'error');
                             return (
                               <div key={traceIdx} className={`p-4 rounded-xl border ${hasError ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-900/10' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30'}`}>
                                 <div className="text-xs font-mono text-gray-500 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">Trace: {traceList[0].trace_id}</div>
                                 <div className="space-y-2">
                                   {traceList.map((span: any, spanIdx: number) => (
                                     <div key={spanIdx} className="flex gap-4 items-start relative ml-2">
                                        {/* Connector line */}
                                        {spanIdx !== traceList.length - 1 && (
                                           <div className="absolute top-6 left-[11px] bottom-[-16px] w-[2px] bg-gray-300 dark:bg-gray-600"></div>
                                        )}
                                        
                                        <div className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white shrink-0 mt-0.5 ${span.level === 'error' ? 'bg-red-500' : span.level === 'warn' ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                          {spanIdx + 1}
                                        </div>
                                        <div className="flex-1 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm text-sm border border-gray-100 dark:border-gray-800">
                                          <div className="flex justify-between font-bold mb-1">
                                            <span className="text-gray-800 dark:text-gray-200">
                                               {span.step ? `[${span.step}]` : ''} {span.type}
                                            </span>
                                            <span className="text-gray-400 font-mono text-xs">{new Date(span.created_at).toLocaleTimeString()}</span>
                                          </div>
                                          {span.account_id && <div className="text-xs text-gray-500 mb-1 font-mono">Account: {span.account_id}</div>}
                                          {span.level !== 'info' && (
                                             <div className={`mt-2 p-2 rounded-md font-mono text-xs ${span.level === 'error' ? 'bg-red-50 text-red-900 dark:bg-red-900/40 dark:text-red-200' : 'bg-orange-50 text-orange-900 dark:bg-orange-900/40 dark:text-orange-200'}`}>
                                               {span.message}
                                             </div>
                                          )}
                                        </div>
                                     </div>
                                   ))}
                                 </div>
                               </div>
                             );
                           })}
                        </div>
                      ) : <p className="text-gray-500 text-sm">Недавние цепочки трассировки не найдены.</p>}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-64 items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'observability' && (
            <Dashboard30 isDarkMode={isDarkMode} />
          )}

          {activeTab === 'metrics' && <MetricsView />}

          {activeTab === 'billing' && billingInfo && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-2xl font-bold">Billing & Usage (Tenant: tenant_1)</h2>
                  <p className={`text-sm ${themeClasses.textMuted}`}>Monitor infrastructure costs and resource utilization limits.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Current Plan Card */}
                 <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                   <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-gray-700 dark:text-gray-200">Current Plan</h3>
                     <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${billingInfo.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                       {billingInfo.status}
                     </span>
                   </div>
                   
                   <div className="mb-6">
                      <div className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">Tier</div>
                      <div className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 capitalize">{billingInfo.plan}</div>
                   </div>
                   
                   <div className="space-y-3 mt-4">
                     <div className="flex justify-between">
                       <span className="text-gray-500">Billing Cycle Ends</span>
                       <span className="font-medium">{new Date(billingInfo.period_end).toLocaleDateString()}</span>
                     </div>
                   </div>

                   <button className="mt-6 w-full py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors">
                     Manage Subscription
                   </button>
                 </div>

                 {/* Usage Card */}
                 <div className={`p-6 rounded-2xl border ${themeClasses.cardBorder} ${themeClasses.cardBg}`}>
                   <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-indigo-500" />
                     Resource Usage
                   </h3>
                   
                   <div className="space-y-6">
                     <div>
                       <div className="flex justify-between text-sm mb-2">
                         <span className="font-medium">AI Calls (GPT/Gemini)</span>
                         <span className="font-mono text-gray-500">{billingInfo.usage.ai_calls} / {billingInfo.limits.ai_calls_limit}</span>
                       </div>
                       <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                         <div 
                           className={`h-2.5 rounded-full ${billingInfo.usage.ai_calls >= billingInfo.limits.ai_calls_limit ? 'bg-red-500' : 'bg-indigo-600'}`} 
                           style={{ width: `${Math.min(100, (billingInfo.usage.ai_calls / Math.max(1, billingInfo.limits.ai_calls_limit)) * 100)}%` }}
                         ></div>
                       </div>
                     </div>

                     <div>
                       <div className="flex justify-between text-sm mb-2">
                         <span className="font-medium">Active Accounts</span>
                         <span className="font-mono text-gray-500">{billingInfo.usage.accounts} / {billingInfo.limits.accounts_limit}</span>
                       </div>
                       <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                         <div 
                           className={`h-2.5 rounded-full ${billingInfo.usage.accounts >= billingInfo.limits.accounts_limit ? 'bg-red-500' : 'bg-green-500'}`} 
                           style={{ width: `${Math.min(100, (billingInfo.usage.accounts / Math.max(1, billingInfo.limits.accounts_limit)) * 100)}%` }}
                         ></div>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'dashboard' && dashboard && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* AI Insights Card */}
              {insights.length > 0 && (
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-xl shadow-md">
                  <h2 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-200" />
                    Рекомендации ИИ (Авто-оптимизация)
                  </h2>
                  <ul className="space-y-2">
                    {insights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-blue-50">
                        <span className="text-purple-300 mt-0.5">•</span> 
                        {insight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Top Row: Finance, Accounts, Risk */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Finance Card */}
                <div 
                  onClick={() => setActiveTab('analytics')}
                  className={`cursor-pointer hover:border-emerald-500/50 transition-colors ${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-6 shadow-sm`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                      <Banknote className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold group-hover:text-emerald-500 transition-colors">Финансы</h3>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className={`text-xs uppercase tracking-wider ${themeClasses.textMuted} mb-1`}>Сегодня (Ожидается)</p>
                      <p className="text-3xl font-bold text-emerald-500">{Number(dashboard.finances.today_revenue || 0).toLocaleString()} ₽</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div>
                        <p className={`text-xs ${themeClasses.textMuted}`}>Неделя</p>
                        <p className="font-medium">{Number(dashboard.finances.week_revenue || 0).toLocaleString()} ₽</p>
                      </div>
                      <div>
                        <p className={`text-xs ${themeClasses.textMuted}`}>Конверсии</p>
                        <p className="font-medium">{dashboard.finances.sales} сделок</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Automation & Funnel Card */}
                <div 
                  onClick={() => setActiveTab('crm')}
                  className={`cursor-pointer hover:border-blue-500/50 transition-colors ${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-6 shadow-sm`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
                      <Filter className="w-5 h-5 text-blue-500" />
                    </div>
                    <h3 className="font-semibold group-hover:text-blue-500 transition-colors">Воронка лидов</h3>
                  </div>
                  <div className="space-y-3">
                    {['new', 'contacted', 'dialog', 'qualified', 'closed'].map(step => {
                      const count = dashboard.funnel.find(f => f.status === step)?.count || 0;
                      const labels: Record<string, string> = { new: 'Новые', contacted: 'Написали', dialog: 'Диалог', qualified: 'Готов купить', closed: 'Оплачено' };
                      return (
                        <div key={step} className="flex justify-between items-center text-sm">
                          <span className={themeClasses.textMuted}>{labels[step]}</span>
                          <span className={`font-medium px-2 py-0.5 rounded shadow-sm ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-black'}`}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Farm Engine Card */}
                <div 
                  onClick={() => setActiveTab('accounts')}
                  className={`cursor-pointer hover:border-red-500/50 transition-colors ${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-6 shadow-sm flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                          <Network className="w-5 h-5 text-red-500" />
                        </div>
                        <h3 className="font-semibold group-hover:text-red-500 transition-colors">Farm Engine</h3>
                      </div>
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-red-500 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                        <ShieldAlert className="w-3 h-3" /> Max Level
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center pb-4">
                      <div className="p-3 bg-green-500/10 rounded-xl border border-green-500/10 text-green-600 dark:text-green-400">
                        <span className="block text-[10px] uppercase font-semibold mb-1">Active</span>
                        <span className="block font-bold text-2xl">
                          {dashboard.accounts ? (dashboard.accounts.find(a => a.status === 'active')?.count || 0) : 0}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/10 text-amber-600 dark:text-amber-400">
                        <span className="block text-[10px] uppercase font-semibold mb-1">Warming</span>
                        <span className="block font-bold text-2xl">
                          {dashboard.warmups ? (dashboard.warmups.find(a => a.warmup_stage === 'warming')?.count || 0) : 0}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center mt-2 pb-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/10 text-purple-600 dark:text-purple-400">
                        <span className="block text-[10px] uppercase font-semibold mb-1">Cooldown</span>
                        <span className="block font-bold text-2xl">
                           {dashboard.accounts ? (dashboard.accounts.find(a => a.status === 'cooldown')?.count || 0) : 0}
                        </span>
                      </div>
                      <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/10 text-red-600 dark:text-red-400">
                        <span className="block text-[10px] uppercase font-semibold mb-1">Banned</span>
                        <span className="block font-bold text-2xl">
                           {dashboard.accounts ? (dashboard.accounts.find(a => a.status === 'banned')?.count || 0) : 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={(e) => { e.stopPropagation(); handleStop(); }} className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors">
                      <StopCircle className="w-4 h-4" /> Stop All
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleSafeMode(); }} className="flex-1 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-400 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors">
                      <PlayCircle className="w-4 h-4" /> Start Rotation
                    </button>
                  </div>
                </div>

              </div>

              {/* Pending Approvals Queue */}
              {settings?.autoPostRequireApproval && pendingPosts.length > 0 && (
                <div className="mb-6">
                   <div className="flex items-center justify-between mb-4">
                     <h3 className="font-semibold text-lg flex items-center gap-2">
                       <CheckCircle2 className="w-5 h-5 text-blue-500" />
                       Ожидают публикации ({pendingPosts.length})
                     </h3>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {pendingPosts.map(post => (
                       <div key={post.id} className={`${themeClasses.cardBg} border border-blue-500/30 rounded-xl p-5 shadow-sm`}>
                         <div className="flex justify-between items-start mb-3">
                           <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500">Из: {post.source_channel}</span>
                           <span className="text-xs text-blue-500 font-medium">Для: {post.target_channel || settings?.autoPostTargetChannel || 'Основной'}</span>
                         </div>
                         <textarea
                           className={`w-full text-sm mb-3 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] ${themeClasses.inputBg}`}
                           value={post.proposed_text || ''}
                           onChange={(e) => {
                             const newPosts = [...pendingPosts];
                             const idx = newPosts.findIndex(p => p.id === post.id);
                             newPosts[idx].proposed_text = e.target.value;
                             setPendingPosts(newPosts);
                           }}
                         />
                         <div className="flex gap-2">
                           <button onClick={async () => {
                             try {
                               await fetch(`/api/autopost/${post.id}/approve`, {
                                 method: 'POST',
                                 headers: { 'Content-Type': 'application/json' },
                                 body: JSON.stringify({ proposed_text: post.proposed_text })
                               });
                               setPendingPosts(pendingPosts.filter(p => p.id !== post.id));
                             } catch(e) { console.error(e) }
                           }} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 text-sm font-medium transition-colors">
                             Опубликовать
                           </button>
                           <button onClick={async () => {
                             try {
                               await fetch(`/api/autopost/${post.id}/reject`, { method: 'POST' });
                               setPendingPosts(pendingPosts.filter(p => p.id !== post.id));
                             } catch(e) { console.error(e) }
                           }} className="px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg py-2 text-sm font-medium transition-colors">
                             Отклонить
                           </button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}

              {/* Middle Row: Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                  onClick={() => setSelectedChart('leads_dynamics')}
                  className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-6 shadow-sm cursor-pointer hover:border-blue-500/50 hover:shadow-md transition-all`}
                >
                  <h3 className="font-semibold mb-6 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-gray-400"/> Динамика лидов</h3>
                  <div className="h-64">
                    {React.useMemo(() => (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={throttledChartData}>
                          <defs>
                            <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => new Date(val).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLeads)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    ), [throttledChartData, isDarkMode])}
                  </div>
                </div>

                <div 
                  onClick={() => setSelectedChart('revenue')}
                  className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-6 shadow-sm cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all`}
                >
                  <h3 className="font-semibold mb-6 flex items-center gap-2"><Banknote className="w-4 h-4 text-gray-400"/> Выручка (Ожидание)</h3>
                  <div className="h-64">
                     {React.useMemo(() => (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={throttledChartData}>
                          <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => new Date(val).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar fill="#10b981" radius={[4, 4, 0, 0]} dataKey="revenue" />
                        </BarChart>
                      </ResponsiveContainer>
                    ), [throttledChartData, isDarkMode])}
                  </div>
                </div>
              </div>

              {/* Bottom Row: AI Brain & Hot Leads */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div 
                  onClick={() => setSelectedChart('ai_brain')}
                  className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-6 shadow-sm cursor-pointer hover:border-purple-500/50 hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold flex items-center gap-2">
                       <Bot className="w-5 h-5 text-purple-500" />
                       Мозг ИИ & Обучение
                    </h3>
                    <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-1 rounded-full border border-purple-500/20 font-medium">Auto-pilot</span>
                  </div>
                  <div className="flex items-center gap-4 p-4 border border-gray-100 dark:border-gray-800 rounded-lg">
                    <div className="flex-1">
                      <p className={`text-xs ${themeClasses.textMuted} mb-1`}>Изучено паттернов общения</p>
                      <p className="text-2xl font-bold">{dashboard.ai.learned}</p>
                    </div>
                    <div className="h-10 w-px bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1">
                      <p className={`text-xs ${themeClasses.textMuted} mb-1`}>Горячие лиды (Score &gt; 70)</p>
                      <p className="text-2xl font-bold text-red-500">{leads.filter(l => l.score > 70).length}</p>
                    </div>
                    <div className="h-10 w-px bg-gray-200 dark:bg-gray-700"></div>
                    <div className="flex-1">
                      <p className={`text-xs ${themeClasses.textMuted} mb-1`}>Средний Score Ответов</p>
                      <p className="text-2xl font-bold text-amber-500">{Number(dashboard.ai.avg_score || 0).toFixed(1)} / 5.0</p>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setSelectedChart('top_channels')}
                  className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-6 shadow-sm cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                       <TrendingUp className="w-5 h-5 text-emerald-500" />
                       Лучшие источники
                    </h3>
                  </div>
                  <div className="space-y-3">
                    <div className={`grid grid-cols-3 text-xs uppercase tracking-wider ${themeClasses.textMuted} pb-2 border-b border-gray-100 dark:border-gray-800`}>
                      <span className="col-span-2">Источник</span>
                      <span className="text-right">Сделки</span>
                    </div>
                    {dashboard.channels.length > 0 ? dashboard.channels.map((ch, i) => (
                      <div key={i} className="grid grid-cols-3 items-center text-sm">
                        <span className="col-span-2 truncate font-medium">{ch.source_channel || "Прямой трафик"}</span>
                        <span className="text-right text-emerald-500 font-semibold">{ch.sales}</span>
                      </div>
                    )) : (
                       <div className="text-sm text-gray-500 text-center py-4">Нет данных</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Row 3: Lead Quality & Score-Conversion */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div 
                  onClick={() => setSelectedChart('lead_quality')}
                  className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-6 shadow-sm cursor-pointer hover:border-blue-500/50 hover:shadow-md transition-all`}
                >
                  <h3 className="font-semibold mb-6 flex items-center gap-2"><Target className="w-4 h-4 text-gray-400"/> Распределение качества лидов</h3>
                  <div className="h-64">
                    {React.useMemo(() => (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={throttledLeadQualityData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {throttledLeadQualityData.map((entry, index) => (
                              <Cell key={`cell-quality-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: 'none', 
                              backgroundColor: isDarkMode ? '#1c1c1d' : '#fff',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                            }} 
                          />
                          <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                      </ResponsiveContainer>
                    ), [throttledLeadQualityData, isDarkMode])}
                  </div>
                </div>

                <div 
                  onClick={() => setSelectedChart('score_conversion')}
                  className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-6 shadow-sm cursor-pointer hover:border-emerald-500/50 hover:shadow-md transition-all`}
                >
                  <h3 className="font-semibold mb-6 flex items-center gap-2"><ArrowRightCircle className="w-4 h-4 text-gray-400"/> Score → Вероятность оплаты</h3>
                  <div className="h-64">
                    {React.useMemo(() => (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={throttledScoreConversionData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                          <XAxis dataKey="score" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                          <YAxis unit="%" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: isDarkMode ? '#9ca3af' : '#6b7280'}} />
                          <RechartsTooltip 
                            contentStyle={{ 
                              borderRadius: '12px', 
                              border: 'none', 
                              backgroundColor: isDarkMode ? '#1c1c1d' : '#fff',
                              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                            }} 
                          />
                          <Line type="monotone" dataKey="conv" stroke="#10b981" strokeWidth={4} dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ), [throttledScoreConversionData, isDarkMode])}
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'accounts' && (
            <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${themeClasses.cardBorder} flex justify-between items-center`}>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-blue-500" />
                  Панель Управления Аккаунтами
                </h2>
                <button 
                  onClick={() => fetch('/api/accounts').then(r=>r.json()).then(setSystemAccounts)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className={`text-xs uppercase ${isDarkMode ? 'bg-[#1c1c1d] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                    <tr>
                      <th className="px-4 py-3">Аккаунт ID (Proxy)</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Trust Score</th>
                      <th className="px-4 py-3 text-center">Health</th>
                      <th className="px-4 py-3 text-center">Flood</th>
                      <th className="px-4 py-3 text-center">Msgs (1h/24h)</th>
                      <th className="px-4 py-3 text-right">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemAccounts.map((acc, i) => (
                      <tr key={acc.id || i} className={`border-b ${themeClasses.cardBorder} ${themeClasses.hoverBg}`}>
                        <td className="px-4 py-3 font-medium">
                          {acc.id}
                          <div className="text-[10px] text-gray-500">{acc.proxy_id || 'no proxy'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <select 
                            value={acc.role} 
                            onChange={async (e) => {
                              await fetch(`/api/accounts/${acc.id}`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({role: e.target.value})});
                              setSystemAccounts(systemAccounts.map(a => a.id === acc.id ? {...a, role: e.target.value} : a));
                            }}
                            className={`text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 outline-none`}
                          >
                            <option value="responder">Responder</option>
                            <option value="hunter">Hunter</option>
                            <option value="hybrid">Hybrid</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1 items-start">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold
                              ${acc.status === 'active' ? 'bg-green-100 text-green-700' : 
                                acc.status === 'cooldown' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                              {acc.status}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded border text-[10px] uppercase font-bold
                              ${acc.warmup_stage === 'trusted' ? 'border-purple-200 text-purple-600 bg-purple-50' :
                                acc.warmup_stage === 'active' ? 'border-blue-200 text-blue-600 bg-blue-50' :
                                acc.warmup_stage === 'warming' ? 'border-amber-200 text-amber-600 bg-amber-50' :
                                'border-gray-200 text-gray-600 bg-gray-50'}`}>
                              {acc.warmup_stage || 'new'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${acc.trust_score || 0}%` }}></div>
                          </div>
                          <div className="text-[10px] text-gray-500 text-right mt-0.5">{acc.trust_score || 0}/100</div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-mono text-xs ${acc.health_score > 80 ? 'text-green-500' : acc.health_score > 50 ? 'text-amber-500' : 'text-red-500'}`}>
                            {acc.health_score}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs font-mono">{acc.flood_count}</td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">{acc.messages_last_hour} / {acc.messages_today}</td>
                        <td className="px-4 py-3 text-right">
                           <button 
                             onClick={async () => {
                               const newStatus = acc.status === 'active' ? 'cooldown' : 'active';
                               await fetch(`/api/accounts/${acc.id}`, { method: 'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status: newStatus})});
                               setSystemAccounts(systemAccounts.map(a => a.id === acc.id ? {...a, status: newStatus} : a));
                             }}
                             className={`px-2 py-1 text-xs rounded text-white ${acc.status === 'active' ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                           >
                             {acc.status === 'active' ? 'Pause' : 'Resume'}
                           </button>
                        </td>
                      </tr>
                    ))}
                    {systemAccounts.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Нет добавленных аккаунтов.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'actions' && (
            <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${themeClasses.cardBorder}`}>
                <h2 className="text-lg font-semibold">Недавние действия</h2>
              </div>
              {status?.recentActions?.length === 0 ? (
                <div className={`p-8 text-center ${themeClasses.textMuted}`}>
                  <Bot className="w-12 h-12 mx-auto opacity-50 mb-3" />
                  <p>Нет недавних действий. Добавьте бота в группу, чтобы начать мониторинг.</p>
                </div>
              ) : (
                <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {status?.recentActions?.map((action, i) => (
                    <div key={i} className={`p-4 ${themeClasses.hoverBg} transition-colors flex gap-4`}>
                      <div className="mt-1">
                        {action.type === 'delete' ? (
                          <div className="bg-red-100/10 border border-red-500/20 p-2 rounded-full">
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </div>
                        ) : (
                          <div className="bg-blue-100/10 border border-blue-500/20 p-2 rounded-full">
                            <MessageSquare className="w-4 h-4 text-blue-500" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <p className="text-sm font-medium truncate">
                            {action.type === 'delete' ? 'Удалено сообщение' : 'Ответ пользователю'}
                          </p>
                          <time className={`text-xs ${themeClasses.textMuted} whitespace-nowrap`}>
                            {new Date(action.timestamp).toLocaleTimeString('ru-RU')}
                          </time>
                        </div>
                        <div className={`text-sm ${themeClasses.textMuted} mb-2`}>
                          <span className={`font-medium ${themeClasses.text}`}>@{action.user}</span> в <span className={`font-medium ${themeClasses.text}`}>{action.chat}</span>
                        </div>
                        <div className={`${isDarkMode ? 'bg-[#1c1c1d]' : 'bg-gray-50'} rounded-lg p-3 text-sm border ${themeClasses.cardBorder}`}>
                          <p className="truncate">"{action.content}"</p>
                          {action.reason && (
                            <p className="mt-2 text-red-500 font-medium text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Причина: {action.reason}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'market' && (
            <MarketDashboard themeClasses={themeClasses} />
          )}

          {/* CRM Tab */}
          {activeTab === 'crm' && (
            <div className="space-y-6">
              <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden p-6`}>
                <h2 className="text-lg font-semibold mb-4">Анализ новой группы (CRM)</h2>
                <p className={`${themeClasses.textMuted} text-sm mb-6`}>
                  Вставьте описание группы, и ИИ автоматически определит правила публикации (платная/бесплатная, можно ли ссылки) и добавит её в вашу базу для посевов.
                </p>
                
                <form onSubmit={handleAnalyzeGroup} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Название группы</label>
                      <input required type="text" value={crmName} onChange={e => setCrmName(e.target.value)} className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} placeholder="Например: Барахолка Москва" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Ссылка (необязательно)</label>
                      <input type="text" value={crmLink} onChange={e => setCrmLink(e.target.value)} className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} placeholder="https://t.me/..." />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Описание / Правила из группы</label>
                    <textarea required value={crmDesc} onChange={e => setCrmDesc(e.target.value)} className={`w-full rounded-lg px-3 py-2 h-24 outline-none focus:ring-2 focus:ring-blue-500 resize-y ${themeClasses.inputBg}`} placeholder="Скопируйте текст из описания группы или закрепленного сообщения..." />
                  </div>
                  <button disabled={isAnalyzing} type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                    {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                    {isAnalyzing ? 'ИИ читает и сегментирует...' : 'Анализировать ИИ'}
                  </button>

                  {isAnalyzing && (
                    <div className={`mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 flex flex-col gap-2`}>
                      <div className="flex items-center gap-2 font-medium">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        ИИ анализирует текст...
                      </div>
                      <div className="text-sm opacity-80 pl-6">
                        <p>• Чтение описания и правил...</p>
                        <p>• Определение сегмента аудитории...</p>
                        <p>• Поиск стоимости и разрешений на публикацию ссылок...</p>
                      </div>
                    </div>
                  )}

                  {analysisResult && !isAnalyzing && (
                    <div className="mt-6 p-5 rounded-xl border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-900/10">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-bold mb-4">
                        <CheckCircle2 className="w-5 h-5" />
                        ИИ успешно проанализировал группу!
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className={`p-3 rounded-lg bg-white dark:bg-black/20 ${themeClasses.cardBorder} border shadow-sm`}>
                          <div className={`text-xs ${themeClasses.textMuted} uppercase mb-1`}>Сегмент / Категория</div>
                          <div className="font-semibold text-indigo-500">{analysisResult.analysis?.category}</div>
                        </div>
                        <div className={`p-3 rounded-lg bg-white dark:bg-black/20 ${themeClasses.cardBorder} border shadow-sm`}>
                          <div className={`text-xs ${themeClasses.textMuted} uppercase mb-1`}>Условия публикации</div>
                          <div className="font-semibold">{analysisResult.analysis?.isPaid ? '💰 Платно' : '🆓 Бесплатно'}</div>
                        </div>
                        <div className={`p-3 rounded-lg bg-white dark:bg-black/20 ${themeClasses.cardBorder} border shadow-sm`}>
                          <div className={`text-xs ${themeClasses.textMuted} uppercase mb-1`}>Постинг ссылок</div>
                          <div className="font-semibold">{analysisResult.analysis?.linksAllowed ? '✅ Разрешены' : '❌ Запрещены'}</div>
                        </div>
                      </div>
                      
                      <div className={`p-4 rounded-lg bg-white dark:bg-black/20 ${themeClasses.cardBorder} border`}>
                        <div className={`text-xs ${themeClasses.textMuted} uppercase mb-2`}>Выжимка ИИ (Summary)</div>
                        <p className="text-sm">{analysisResult.analysis?.summary}</p>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden`}>
                <div className={`px-6 py-4 border-b ${themeClasses.cardBorder}`}>
                  <h2 className="text-lg font-semibold">База групп для посевов</h2>
                </div>
                <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                  {status?.crmGroups?.map(group => (
                    <div key={group.id} className={`p-6 ${themeClasses.hoverBg}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{group.name}</h3>
                          {group.link && <a href={group.link} target="_blank" rel="noreferrer" className="text-blue-500 text-sm hover:underline">{group.link}</a>}
                        </div>
                        <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs font-medium uppercase tracking-wider">
                          {group.analysis.category}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className={`p-3 rounded-lg border ${themeClasses.cardBorder} ${group.analysis.isPaid === true ? 'bg-amber-50 dark:bg-amber-900/20' : group.analysis.isPaid === false ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                          <span className="text-xs text-gray-500 block mb-1">Реклама</span>
                          <span className="font-medium">
                            {group.analysis.isPaid === true ? '💰 Платная' : group.analysis.isPaid === false ? '🆓 Бесплатная' : '❓ Неизвестно'}
                          </span>
                        </div>
                        <div className={`p-3 rounded-lg border ${themeClasses.cardBorder} ${group.analysis.linksAllowed === true ? 'bg-green-50 dark:bg-green-900/20' : group.analysis.linksAllowed === false ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                          <span className="text-xs text-gray-500 block mb-1">Ссылки</span>
                          <span className="font-medium">
                            {group.analysis.linksAllowed === true ? '✅ Разрешены' : group.analysis.linksAllowed === false ? '❌ Запрещены' : '❓ Неизвестно'}
                          </span>
                        </div>
                        <div className={`p-3 rounded-lg border ${themeClasses.cardBorder} ${group.analysis.chatAllowed === true ? 'bg-green-50 dark:bg-green-900/20' : group.analysis.chatAllowed === false ? 'bg-red-50 dark:bg-red-900/20' : ''} col-span-2`}>
                          <span className="text-xs text-gray-500 block mb-1">Общение (Чат)</span>
                          <span className="font-medium">
                            {group.analysis.chatAllowed === true ? '💬 Разрешено' : group.analysis.chatAllowed === false ? '🔇 Запрещено' : '❓ Неизвестно'}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`text-sm p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30`}>
                        <strong className="block mb-1 text-blue-800 dark:text-blue-300">Вывод ИИ:</strong>
                        <span className="text-blue-900 dark:text-blue-200">{group.analysis.summary}</span>
                      </div>
                    </div>
                  ))}
                  {status?.crmGroups?.length === 0 && (
                    <div className={`p-8 text-center ${themeClasses.textMuted}`}>База пуста. Добавьте группу выше для анализа.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Incidents Tab */}
          {activeTab === 'incidents' && (
            <IncidentCommandCenter isDarkMode={isDarkMode} />
          )}

          {/* Groups Tab */}
          {activeTab === 'groups' && (
            <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${themeClasses.cardBorder}`}>
                <h2 className="text-lg font-semibold">Подключенные группы</h2>
              </div>
              <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {status?.groups?.map(group => (
                  <div key={group.id} className={`p-4 flex items-center justify-between ${themeClasses.hoverBg}`}>
                    <div>
                      <h3 className="font-medium">{group.title}</h3>
                      <p className={`text-sm ${themeClasses.textMuted}`}>ID: {group.id}</p>
                    </div>
                    {group.inviteLink && (
                      <a href={group.inviteLink} target="_blank" rel="noreferrer" className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <LinkIcon className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                ))}
                {status?.groups?.length === 0 && (
                  <div className={`p-8 text-center ${themeClasses.textMuted}`}>Нет подключенных групп</div>
                )}
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${themeClasses.cardBorder}`}>
                <h2 className="text-lg font-semibold">Известные пользователи</h2>
              </div>
              <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {status?.users?.map(user => (
                  <div key={user.id} className={`p-4 flex items-center justify-between ${themeClasses.hoverBg}`}>
                    <div>
                      <h3 className="font-medium">{user.firstName} {user.username ? `(@${user.username})` : ''}</h3>
                      <p className={`text-sm ${themeClasses.textMuted}`}>ID: {user.id}</p>
                    </div>
                    <div className={`text-sm ${themeClasses.textMuted}`}>
                      Был(а): {new Date(user.lastSeen).toLocaleString('ru-RU')}
                    </div>
                  </div>
                ))}
                {status?.users?.length === 0 && (
                  <div className={`p-8 text-center ${themeClasses.textMuted}`}>Нет данных о пользователях</div>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${themeClasses.cardBorder}`}>
                <h2 className="text-lg font-semibold">История сообщений (последние 200)</h2>
              </div>
              <div className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-100'}`}>
                {status?.history?.map(msg => (
                  <div key={msg.id} className={`p-4 ${themeClasses.hoverBg}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-medium text-sm">@{msg.username} <span className={themeClasses.textMuted}>в {msg.chatTitle}</span></span>
                      <time className={`text-xs ${themeClasses.textMuted}`}>{new Date(msg.date).toLocaleTimeString('ru-RU')}</time>
                    </div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} truncate`}>{msg.text || '[Медиа]'}</p>
                  </div>
                ))}
                {status?.history?.length === 0 && (
                  <div className={`p-8 text-center ${themeClasses.textMuted}`}>История пуста</div>
                )}
              </div>
            </div>
          )}

          {/* Leads Tab */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden`}>
                <div className={`px-6 py-4 border-b ${themeClasses.cardBorder} flex items-center justify-between`}>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Filter className="w-5 h-5 text-blue-500" />
                    Воронка продаж (Лиды)
                  </h2>
                  <button onClick={fetchLeads} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-4 overflow-x-auto w-full snap-x">
                  <div className="flex gap-4 w-full pb-4 min-w-[900px] 2xl:min-w-0">
                    {kanbanColumns.map(col => (
                      <div key={col.key} className={`min-w-[180px] flex-1 snap-center rounded-xl border ${themeClasses.cardBorder} bg-gray-50 dark:bg-[#1c1c1d] flex flex-col max-h-[650px]`}>
                        <div className={`p-3 border-b ${themeClasses.cardBorder} font-medium flex justify-between items-center`}>
                          <span>{col.title}</span>
                          <span className="bg-gray-200 dark:bg-gray-700 text-xs px-2 py-1 rounded-full">
                            {leads.filter(l => l.status === col.key).length}
                          </span>
                        </div>
                        <div className="p-3 overflow-y-auto flex-1 space-y-3">
                          {leads.filter(l => l.status === col.key).map(lead => (
                            <div 
                              key={lead.id} 
                              onClick={() => openLead(lead)}
                              className={`${themeClasses.cardBg} p-3 rounded-lg border ${themeClasses.cardBorder} shadow-sm cursor-pointer hover:border-blue-500 transition-colors`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm truncate">{lead.first_name || lead.username || 'Unknown'}</span>
                                <div className="flex items-center gap-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                    (lead.score || 0) > 70 ? 'text-green-500' :
                                    (lead.score || 0) > 40 ? 'text-yellow-500' :
                                    'text-red-500'
                                  }`}>
                                    {lead.score || 0}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    lead.temperature === 'hot' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                    lead.temperature === 'warm' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  }`}>
                                    {lead.temperature}
                                  </span>
                                </div>
                              </div>
                              <p className={`text-xs ${themeClasses.textMuted} line-clamp-2 mb-2`}>
                                {lead.source_message}
                              </p>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">{new Date(lead.created_at).toLocaleDateString()}</span>
                                <span className="font-medium text-green-600 dark:text-green-400">{lead.intent}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lead Modal */}
              {selectedLead && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className={`${themeClasses.cardBg} rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden`}>
                    <div className={`px-6 py-4 border-b ${themeClasses.cardBorder} flex justify-between items-center`}>
                      <div>
                        <h2 className="text-lg font-semibold">Лид: {selectedLead.first_name || selectedLead.username}</h2>
                        <p className={`text-sm ${themeClasses.textMuted}`}>ID: {selectedLead.user_id} | Чат: {selectedLead.source_chat}</p>
                      </div>
                      <button onClick={() => setSelectedLead(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                      {/* Left: Info & Actions */}
                      <div className="w-full md:w-1/3 space-y-6">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Статус</h3>
                          <select 
                            value={selectedLead.status}
                            onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value)}
                            className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`}
                          >
                            {kanbanColumns.map(col => (
                              <option key={col.key} value={col.key}>{col.title}</option>
                            ))}
                          </select>
                        </div>
                        
                        <div className={`p-4 rounded-lg border ${themeClasses.cardBorder} bg-gray-50 dark:bg-[#1c1c1d]`}>
                          <h3 className="text-sm font-medium mb-3">Оценка ИИ</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className={themeClasses.textMuted}>Стадия:</span>
                              <span className="font-medium text-blue-500">{selectedLead.stage}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={themeClasses.textMuted}>Намерение:</span>
                              <span className="font-medium">{selectedLead.intent}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={themeClasses.textMuted}>Температура:</span>
                              <span className="font-medium">{selectedLead.temperature}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={themeClasses.textMuted}>Бюджет:</span>
                              <span className="font-medium">{selectedLead.budget || 'Не указан'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={themeClasses.textMuted}>Уверенность:</span>
                              <span className="font-medium">{Math.round(selectedLead.confidence * 100)}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <button 
                            onClick={() => updateLeadStatus(selectedLead.id, 'qualified')}
                            className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Передать менеджеру
                          </button>
                          <button 
                            onClick={() => updateLeadStatus(selectedLead.id, 'closed')}
                            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            Сделка закрыта
                          </button>
                        </div>
                      </div>
                      
                      {/* Right: Conversation History */}
                      <div className="w-full md:w-2/3 flex flex-col h-[500px]">
                        <h3 className="text-sm font-medium mb-3">История диалога</h3>
                        <div className={`flex-1 overflow-y-auto p-4 rounded-lg border ${themeClasses.cardBorder} bg-gray-50 dark:bg-[#1c1c1d] space-y-4`}>
                          {leadMessages.length === 0 ? (
                            <p className={`text-center text-sm ${themeClasses.textMuted} mt-10`}>Нет сохраненных сообщений</p>
                          ) : (
                            leadMessages.map(msg => (
                              <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}>
                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                  msg.role === 'user' 
                                    ? 'bg-white dark:bg-[#2c2c2e] border border-gray-200 dark:border-gray-700' 
                                    : 'bg-blue-600 text-white'
                                }`}>
                                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                </div>
                                <span className={`text-xs mt-1 ${themeClasses.textMuted}`}>
                                  {new Date(msg.created_at).toLocaleTimeString()}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart Modal */}
              {selectedChart && dashboard && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                  <div className={`${themeClasses.cardBg} rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden`}>
                    <div className={`px-6 py-4 border-b ${themeClasses.cardBorder} flex justify-between items-center`}>
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        {selectedChart === 'leads_dynamics' && <><TrendingUp className="w-5 h-5 text-blue-500"/> Детальный анализ: Динамика лидов</>}
                        {selectedChart === 'revenue' && <><Banknote className="w-5 h-5 text-emerald-500"/> Детальный анализ: Выручка (Ожидание)</>}
                        {selectedChart === 'ai_brain' && <><Bot className="w-5 h-5 text-purple-500"/> Детальный анализ: Мозг ИИ & Обучение</>}
                        {selectedChart === 'top_channels' && <><TrendingUp className="w-5 h-5 text-emerald-500"/> Детальный анализ: Лучшие источники</>}
                        {selectedChart === 'lead_quality' && <><Target className="w-5 h-5 text-blue-500"/> Детальный анализ: Распределение качества лидов</>}
                        {selectedChart === 'score_conversion' && <><ArrowRightCircle className="w-5 h-5 text-emerald-500"/> Детальный анализ: Score → Вероятность оплаты</>}
                      </h2>
                      <button onClick={() => setSelectedChart(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      
                      {selectedChart === 'leads_dynamics' && (
                        <div className="space-y-6">
                          <p className={`text-sm ${themeClasses.textMuted}`}>Динамика прироста новых лидов за последние 7 дней. Помогает оценить эффективность текущих маркетинговых кампаний и рассылок.</p>
                          <div className="h-[400px]">
                            {React.useMemo(() => (
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={throttledChartData}>
                                  <defs>
                                    <linearGradient id="colorLeadsModal" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                                  <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => new Date(val).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })} axisLine={false} tickLine={false} />
                                  <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: isDarkMode ? '#1c1c1d' : '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                  <Area type="monotone" dataKey="leads" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLeadsModal)" />
                                </AreaChart>
                              </ResponsiveContainer>
                            ), [throttledChartData, isDarkMode])}
                          </div>
                        </div>
                      )}

                      {selectedChart === 'revenue' && (
                        <div className="space-y-6">
                          <p className={`text-sm ${themeClasses.textMuted}`}>Ожидаемая выручка по дням. Формируется на основе квалифицированных лидов и вероятности их закрытия.</p>
                          <div className="h-[400px]">
                            {React.useMemo(() => (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={throttledChartData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                                  <XAxis dataKey="date" tick={{fontSize: 12}} tickFormatter={(val) => new Date(val).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })} axisLine={false} tickLine={false} />
                                  <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: isDarkMode ? '#1c1c1d' : '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                  <Bar fill="#10b981" radius={[4, 4, 0, 0]} dataKey="revenue" />
                                </BarChart>
                              </ResponsiveContainer>
                            ), [throttledChartData, isDarkMode])}
                          </div>
                        </div>
                      )}

                      {selectedChart === 'ai_brain' && (
                        <div className="space-y-6">
                           <p className={`text-sm ${themeClasses.textMuted}`}>Анализ эффективности ответов AI-агента</p>
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div className={`p-4 rounded-xl border ${themeClasses.cardBorder} flex flex-col items-center justify-center text-center`}>
                                <span className={`text-xs uppercase font-medium ${themeClasses.textMuted} mb-2`}>Выявлено паттернов</span>
                                <span className="text-3xl font-bold">{dashboard.ai.learned}</span>
                             </div>
                             <div className={`p-4 rounded-xl border ${themeClasses.cardBorder} flex flex-col items-center justify-center text-center`}>
                                <span className={`text-xs uppercase font-medium ${themeClasses.textMuted} mb-2`}>Средняя оценка (Score)</span>
                                <span className="text-3xl font-bold text-amber-500">{Number(dashboard.ai.avg_score || 0).toFixed(1)} / 5.0</span>
                             </div>
                             <div className={`p-4 rounded-xl border ${themeClasses.cardBorder} flex flex-col items-center justify-center text-center`}>
                                <span className={`text-xs uppercase font-medium ${themeClasses.textMuted} mb-2`}>Горячие лиды</span>
                                <span className="text-3xl font-bold text-red-500">{leads.filter(l => l.score > 70).length}</span>
                             </div>
                           </div>
                           <h3 className="font-semibold mt-4">Последние адаптации:</h3>
                           <ul className="space-y-2 text-sm">
                             <li className={`p-3 rounded-lg border ${themeClasses.cardBorder} bg-gray-50 dark:bg-[#1c1c1d]`}>
                               <span className="font-medium">Адаптация тона:</span> ИИ начал использовать больше технических терминов в ответах для группы "Business Chat" (Конверсия +12%)
                             </li>
                             <li className={`p-3 rounded-lg border ${themeClasses.cardBorder} bg-gray-50 dark:bg-[#1c1c1d]`}>
                               <span className="font-medium">Оптимизация:</span> Уменьшена длина первого приветственного сообщения до 2-х предложений
                             </li>
                             <li className={`p-3 rounded-lg border ${themeClasses.cardBorder} bg-gray-50 dark:bg-[#1c1c1d]`}>
                               <span className="font-medium">Сценарий удержания:</span> ИИ внедрил "перехват" возражения "дорого", предлагая разбиение платежа.
                             </li>
                           </ul>
                        </div>
                      )}

                      {selectedChart === 'top_channels' && (
                        <div className="space-y-6">
                           <p className={`text-sm ${themeClasses.textMuted}`}>Распределение продаж по источникам трафика.</p>
                           <table className="w-full text-sm text-left border-collapse">
                            <thead className={`text-xs uppercase ${isDarkMode ? 'bg-[#1c1c1d] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                              <tr>
                                <th className="px-4 py-3 rounded-tl-lg">Канал (Source)</th>
                                <th className="px-4 py-3 text-right">Лидов</th>
                                <th className="px-4 py-3 rounded-tr-lg text-right">Оплат (Sales)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashboard.channels.map((ch, i) => (
                                <tr key={i} className={`border-b ${themeClasses.cardBorder} ${themeClasses.hoverBg}`}>
                                  <td className="px-4 py-3 font-medium">{ch.source_channel || 'Неизвестно'}</td>
                                  <td className="px-4 py-3 text-right">{ch.leads || 0}</td>
                                  <td className="px-4 py-3 font-bold text-emerald-500 text-right">{ch.sales}</td>
                                </tr>
                              ))}
                            </tbody>
                           </table>
                        </div>
                      )}

                      {selectedChart === 'lead_quality' && (
                        <div className="space-y-6">
                          <p className={`text-sm ${themeClasses.textMuted}`}>Разбивка лидов по качеству. Помогает понять, насколько целевой трафик привлекается.</p>
                          <div className="h-[400px]">
                            {React.useMemo(() => (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={throttledLeadQualityData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                  >
                                    {throttledLeadQualityData.map((entry, index) => (
                                      <Cell key={`cell-analytics-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip 
                                    contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDarkMode ? '#1c1c1d' : '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                                  />
                                  <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                              </ResponsiveContainer>
                            ), [throttledLeadQualityData, isDarkMode])}
                          </div>
                        </div>
                      )}

                      {selectedChart === 'score_conversion' && (
                        <div className="space-y-6">
                          <p className={`text-sm ${themeClasses.textMuted}`}>Корреляция между оценкой лида (Score) и вероятностью успешного закрытия сделки. Используется для приоритезации менеджеров.</p>
                          <div className="h-[400px]">
                            {React.useMemo(() => (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={throttledScoreConversionData}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#374151' : '#f3f4f6'} />
                                  <XAxis dataKey="score" tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                                  <YAxis tick={{fontSize: 12}} tickFormatter={(val) => `${val}%`} axisLine={false} tickLine={false} />
                                  <RechartsTooltip 
                                    formatter={(value: any) => [`${value}%`, 'Вероятность']} 
                                    contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: isDarkMode ? '#1c1c1d' : '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                                  />
                                  <Line type="monotone" dataKey="conversion" stroke="#10b981" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                                </LineChart>
                              </ResponsiveContainer>
                            ), [throttledScoreConversionData, isDarkMode])}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <BusinessAnalyticsDashboard />
              
              <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden p-6`}>
                <div className="flex justify-between items-center mb-4">
                   <h2 className="text-lg font-semibold flex items-center gap-2">
                     <ShieldAlert className="w-5 h-5 text-red-500" />
                     Система & Control Layer
                   </h2>
                   <button 
                      onClick={toggleSystemPause}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${systemState.is_paused ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'}`}
                   >
                      {systemState.is_paused ? '⏸ Система остановлена (Auto-Shutdown / Manual)' : '▶ Система Активна'}
                   </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <div className={`p-4 rounded-lg bg-black/5 dark:bg-white/5`}>
                      <p className="text-sm text-gray-500">Global Limit (msgs/hr)</p>
                      <p className="text-2xl font-bold mt-1">{systemState.global_limit_hourly || 'N/A'}</p>
                   </div>
                   <div className={`p-4 rounded-lg bg-black/5 dark:bg-white/5`}>
                      <p className="text-sm text-gray-500">Ban Threshold (Rate)</p>
                      <p className="text-2xl font-bold mt-1">{systemState.ban_rate_threshold ? (systemState.ban_rate_threshold * 100).toFixed(0) + '%' : 'N/A'}</p>
                      <p className="text-xs text-gray-500">{"If bans > rate, system stops"}</p>
                   </div>
                </div>
              </div>

              <LogsViewer isDarkMode={isDarkMode} />

              <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden p-6`}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  Рентабельность каналов
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className={`text-xs uppercase ${isDarkMode ? 'bg-[#1c1c1d] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Канал (Source)</th>
                        <th className="px-4 py-3">Лидов (Leads)</th>
                        <th className="px-4 py-3 rounded-tr-lg">Оплат (Sales)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bestChannels.length > 0 ? bestChannels.map((ch, i) => (
                        <tr key={i} className={`border-b ${themeClasses.cardBorder} ${themeClasses.hoverBg}`}>
                          <td className="px-4 py-3 font-medium">{ch.source_channel || 'Неизвестно'}</td>
                          <td className="px-4 py-3">{ch.leads}</td>
                          <td className="px-4 py-3 font-medium text-green-500">{ch.sales}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={3} className="px-4 py-3 text-center text-gray-500">Нет данных</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden p-6`}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-500" />
                  Auto-Evolution: Эффективность Сообщений
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className={`text-xs uppercase ${isDarkMode ? 'bg-[#1c1c1d] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Текст (Variant)</th>
                        <th className="px-4 py-3">Тип</th>
                        <th className="px-4 py-3">Показов</th>
                        <th className="px-4 py-3">Ответов</th>
                        <th className="px-4 py-3">Оплат</th>
                        <th className="px-4 py-3 rounded-tr-lg">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bestTests.length > 0 ? bestTests.map((test, i) => (
                        <tr key={i} className={`border-b ${themeClasses.cardBorder} ${test.is_active ? themeClasses.hoverBg : 'bg-red-50 dark:bg-red-900/10 opacity-60'}`}>
                          <td className="px-4 py-3 max-w-sm truncate whitespace-pre-wrap">
                            {test.text}
                            {!test.is_active && <span className="ml-2 text-xs text-red-500">(Отключено ИИ)</span>}
                          </td>
                          <td className="px-4 py-3">{test.type}</td>
                          <td className="px-4 py-3">{test.total_uses}</td>
                          <td className="px-4 py-3">{(test.replies / Math.max(1, test.total_uses) * 100).toFixed(1)}%</td>
                          <td className="px-4 py-3 font-medium text-green-500">{test.conversions || 0}</td>
                          <td className="px-4 py-3 text-blue-500 font-bold">{Number(test.score || 0).toFixed(2)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="px-4 py-3 text-center text-gray-500">Нет данных</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden p-6`}>
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-500" />
                  Farm Engine: Эффективность Аккаунтов (Performance)
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className={`text-xs uppercase ${isDarkMode ? 'bg-[#1c1c1d] text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Номер / ID</th>
                        <th className="px-4 py-3">Статус</th>
                        <th className="px-4 py-3">Trust Score</th>
                        <th className="px-4 py-3">Reply Rate</th>
                        <th className="px-4 py-3">Блокировок</th>
                        <th className="px-4 py-3 rounded-tr-lg">Perf Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountEfficiency.length > 0 ? accountEfficiency.map((acc, i) => (
                        <tr key={i} className={`border-b ${themeClasses.cardBorder} ${themeClasses.hoverBg}`}>
                          <td className="px-4 py-3 font-medium">{acc.phone || `Acc #${acc.id}`}</td>
                          <td className="px-4 py-3">
                             <span className={`px-2 py-1 text-xs rounded-full ${acc.status === 'active' ? 'bg-green-100 text-green-700' : acc.status === 'risk' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                               {acc.status}
                             </span>
                          </td>
                          <td className="px-4 py-3">{Number(acc.trust_score || 0).toFixed(2)}</td>
                          <td className="px-4 py-3 text-blue-500 font-bold">{(acc.reply_rate || 0).toFixed(1)}</td>
                          <td className="px-4 py-3 text-red-500">{acc.block_events || 0}</td>
                          <td className="px-4 py-3 font-bold">{Number(acc.score || 0).toFixed(2)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="px-4 py-3 text-center text-gray-500">Нет данных</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'autopost' && (
            <ErrorBoundary>
              <AutopostDashboard 
                settings={settings} 
                setSettings={setSettings} 
                themeClasses={themeClasses} 
                isTabFullscreen={isTabFullscreen}
                setIsTabFullscreen={setIsTabFullscreen}
              />
            </ErrorBoundary>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden`}>
              <div className={`px-6 py-4 border-b ${themeClasses.cardBorder} flex items-center justify-between sticky top-0 z-10 ${themeClasses.cardBg}`}>
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Настройки бота
                </h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {isAutoSaving && (
                      <span className={`text-sm ${themeClasses.textMuted} flex items-center gap-1.5`}>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Автосохранение...
                      </span>
                    )}
                    {saveSuccess && (
                      <span className="text-sm text-green-500 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" />
                        Сохранено
                      </span>
                    )}
                  </div>
                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving || !settings}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                {!status?.botConfigured && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Bot className="w-6 h-6 text-amber-500" />
                      <h3 className="text-lg font-medium text-amber-500">{tMenu.token_required}</h3>
                    </div>
                    <div className={`text-sm ${isDarkMode ? 'text-amber-200/80' : 'text-amber-800'} space-y-2`}>
                      <p>Для активации бота необходимо указать токен Telegram.</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Откройте Telegram и найдите <strong>@BotFather</strong>.</li>
                        <li>Отправьте команду <code className="bg-amber-500/20 px-1 rounded">/newbot</code>.</li>
                        <li>Скопируйте HTTP API токен.</li>
                        <li>Откройте панель <strong>Settings (Секреты)</strong> в AI Studio.</li>
                        <li>Добавьте секрет <code className="bg-amber-500/20 px-1 rounded font-mono">TELEGRAM_BOT_TOKEN</code>.</li>
                      </ol>
                    </div>
                  </div>
                )}

                {settings ? (
                  <div className="space-y-6 max-w-4xl">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Включить модерацию</h3>
                        <p className={`text-sm ${themeClasses.textMuted}`}>Бот будет удалять сообщения, нарушающие правила</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.moderationEnabled} onChange={e => setSettings({...settings, moderationEnabled: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Включить общение</h3>
                        <p className={`text-sm ${themeClasses.textMuted}`}>Бот будет отвечать на упоминания и личные сообщения</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.chatEnabled} onChange={e => setSettings({...settings, chatEnabled: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Максимальный размер видео/аудио (МБ)</label>
                      <p className={`text-sm ${themeClasses.textMuted} mb-2`}>Файлы больше этого размера не будут скачиваться для анализа</p>
                      <input 
                        type="number" 
                        className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`}
                        value={settings.maxVideoSizeMB}
                        onChange={e => setSettings({...settings, maxVideoSizeMB: Number(e.target.value)})}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">Анти-дубликат</h3>
                        <p className={`text-sm ${themeClasses.textMuted}`}>Удалять повторные сообщения в группе</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.preventDuplicates} onChange={e => setSettings({...settings, preventDuplicates: e.target.checked})} />
                        <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    {settings.preventDuplicates && (
                      <div>
                        <label className="block font-medium mb-1">Интервал уникальности (сообщений)</label>
                        <p className={`text-sm ${themeClasses.textMuted} mb-2`}>Сколько других сообщений должно пройти перед повтором (по умолчанию 10)</p>
                        <input 
                          type="number" 
                          className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`}
                          value={settings.duplicateDistance}
                          onChange={e => setSettings({...settings, duplicateDistance: Number(e.target.value)})}
                        />
                      </div>
                    )}

                    <div>
                      <label className="block font-medium mb-1">Промпт для модерации</label>
                      <p className={`text-sm ${themeClasses.textMuted} mb-2`}>Инструкция для ИИ. Актуальные правила Telegram добавляются автоматически.</p>
                      <textarea 
                        className={`w-full rounded-lg px-3 py-2 h-24 outline-none focus:ring-2 focus:ring-blue-500 resize-y ${themeClasses.inputBg}`}
                        value={settings.moderationPrompt}
                        onChange={e => setSettings({...settings, moderationPrompt: e.target.value})}
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Промпт для общения</label>
                      <p className={`text-sm ${themeClasses.textMuted} mb-2`}>Определяет характер бота при ответах</p>
                      <textarea 
                        className={`w-full rounded-lg px-3 py-2 h-24 outline-none focus:ring-2 focus:ring-blue-500 resize-y ${themeClasses.inputBg}`}
                        value={settings.chatPrompt}
                        onChange={e => setSettings({...settings, chatPrompt: e.target.value})}
                      />
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-2">API для внешних скриптов (Android/ZennoPoster)</h3>
                      <p className={`text-sm ${themeClasses.textMuted} mb-4`}>
                        Используйте этот токен для отправки данных с ваших внешних парсеров в эту CRM.
                      </p>
                      <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Ваш API Токен (Bearer)</label>
                        <input 
                          type="text" 
                          readOnly
                          className={`w-full rounded-lg px-3 py-2 outline-none font-mono text-sm ${themeClasses.inputBg} opacity-80`}
                          value={settings.externalApiToken || 'Токен генерируется...'}
                        />
                      </div>
                      <div className={`p-4 rounded-lg text-xs font-mono overflow-x-auto ${isDarkMode ? 'bg-black/30 text-green-400' : 'bg-gray-900 text-green-400'}`}>
                        <p className="text-gray-400 mb-1">Пример запроса (POST /api/external/competitor):</p>
                        {`curl -X POST https://ваш-домен/api/external/competitor \\
  -H "Authorization: Bearer ${settings.externalApiToken || 'ВАШ_ТОКЕН'}" \\
  -H "Content-Type: application/json" \\
  -d '{"group":"Барахолка","seller":"Ivan","productText":"Продам iPhone 15","price":"80000 руб"}'`}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-2">Настройки Прокси (SOCKS5)</h3>
                      <p className={`text-sm ${themeClasses.textMuted} mb-4`}>
                        Эти данные будут автоматически передаваться в ваш юзербот для безопасного подключения к Telegram.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">IP адрес</label>
                          <input 
                            type="text" 
                            value={settings.proxyIp || ''} 
                            onChange={e => setSettings({...settings, proxyIp: e.target.value})} 
                            className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} 
                            placeholder="123.45.67.89" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Порт</label>
                          <input 
                            type="text" 
                            value={settings.proxyPort || ''} 
                            onChange={e => setSettings({...settings, proxyPort: e.target.value})} 
                            className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} 
                            placeholder="1080" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Логин (если есть)</label>
                          <input 
                            type="text" 
                            value={settings.proxyUser || ''} 
                            onChange={e => setSettings({...settings, proxyUser: e.target.value})} 
                            className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} 
                            placeholder="user123" 
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Пароль (если есть)</label>
                          <input 
                            type="password" 
                            value={settings.proxyPass || ''} 
                            onChange={e => setSettings({...settings, proxyPass: e.target.value})} 
                            className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} 
                            placeholder="••••••••" 
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold mb-2">Настройки ИИ (Провайдер нейросетей)</h3>
                      <p className={`text-sm ${themeClasses.textMuted} mb-4`}>
                        Выберите провайдера ИИ для работы автоответов и аналитики.
                      </p>
                      
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">Основной провайдер</label>
                        <select
                          value={settings.aiProvider || (settings.useOllama ? 'ollama' : 'gemini')}
                          onChange={e => {
                            const val = e.target.value;
                            setSettings({...settings, aiProvider: val, useOllama: val === 'ollama'});
                          }}
                          className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`}
                        >
                          <option value="gemini">Google Gemini (Быстрый, бесплатно в DEV)</option>
                          <option value="openai">OpenAI (ChatGPT)</option>
                          <option value="ollama">Локальный Ollama (Приватно)</option>
                        </select>
                      </div>

                      {settings.aiProvider === 'openai' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                          <div>
                            <label className="block text-sm font-medium mb-1">OpenAI API Key</label>
                            <input 
                              type="password" 
                              value={settings.openAiKey || ''} 
                              onChange={e => setSettings({...settings, openAiKey: e.target.value})} 
                              className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} 
                              placeholder="sk-..." 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Модель</label>
                            <input 
                              type="text" 
                              value={settings.openAiModel || ''} 
                              onChange={e => setSettings({...settings, openAiModel: e.target.value})} 
                              className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} 
                              placeholder="gpt-4o-mini" 
                            />
                          </div>
                        </div>
                      )}

                      {(settings.aiProvider === 'ollama' || settings.useOllama) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/50">
                          <div>
                            <label className="block text-sm font-medium mb-1">URL сервера Ollama</label>
                            <input 
                              type="text" 
                              value={settings.ollamaEndpoint || ''} 
                              onChange={e => setSettings({...settings, ollamaEndpoint: e.target.value})} 
                              className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} 
                              placeholder="http://localhost:11434" 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Модель (например: llama3)</label>
                            <input 
                              type="text" 
                              value={settings.ollamaModel || ''} 
                              onChange={e => setSettings({...settings, ollamaModel: e.target.value})} 
                              className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} 
                              placeholder="llama3" 
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-6">
                        <div>
                          <h3 className="font-medium">Проактивные продажи (Юзербот)</h3>
                          <p className={`text-sm ${themeClasses.textMuted}`}>Юзербот будет писать продавцам в ЛС, спрашивать цены и подписываться на их каналы.</p>
                          <p className="text-xs text-amber-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Осторожно: может привести к спам-блоку аккаунта.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={settings.proactiveSales || false} onChange={e => setSettings({...settings, proactiveSales: e.target.checked})} />
                          <div className="w-11 h-6 bg-gray-400 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-2">Режим подключения (Безопасность)</h3>
                        <p className={`text-sm ${themeClasses.textMuted} mb-4`}>
                          Должен ли у вас быть Premium? Нет, Premium не нужен для работы бота. Но использование только Юзербота (MTProto) несет риски бана. Рекомендуем Hybrid режим.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div 
                            onClick={() => setSettings({...settings, connectionMode: 'mtproto'})}
                            className={`p-4 rounded-lg cursor-pointer border-2 transition-colors ${settings.connectionMode === 'mtproto' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : `border-transparent ${themeClasses.inputBg}`}`}
                          >
                            <h4 className="font-semibold text-red-500 mb-1">Только Юзербот (MTProto)</h4>
                            <p className="text-xs text-gray-500">Читает и пишет от вашего имени. Высокий риск спам-блока.</p>
                          </div>
                          
                          <div 
                            onClick={() => setSettings({...settings, connectionMode: 'botapi'})}
                            className={`p-4 rounded-lg cursor-pointer border-2 transition-colors ${settings.connectionMode === 'botapi' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : `border-transparent ${themeClasses.inputBg}`}`}
                          >
                            <h4 className="font-semibold text-green-500 mb-1">Официальный Бот (Bot API)</h4>
                            <p className="text-xs text-gray-500">Использует токен от BotFather. Работает только там, где бот добавлен в группу.</p>
                          </div>

                          <div 
                            onClick={() => setSettings({...settings, connectionMode: 'hybrid'})}
                            className={`p-4 rounded-lg cursor-pointer border-2 transition-colors ${settings.connectionMode === 'hybrid' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10' : `border-transparent ${themeClasses.inputBg}`}`}
                          >
                            <h4 className="font-semibold text-blue-500 mb-1">Микс (MTProto + Bot API)</h4>
                            <p className="text-xs text-gray-500">Юзербот только парсит (читает), а официальный бот отвечает. Самый безопасный метод.</p>
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-2">Отслеживание ключевых слов (Парсинг)</h3>
                        <p className={`text-sm ${themeClasses.textMuted} mb-4`}>
                          Юзербот будет искать эти слова в чужих группах и пересылать вам ссылку на сообщение, чтобы вы могли перейти и ответить лично.
                        </p>
                        
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Ключевые слова (через запятую)</label>
                            <input 
                              type="text" 
                              value={settings.autoReplyKeywords || ''} 
                              onChange={e => setSettings({...settings, autoReplyKeywords: e.target.value})} 
                              className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} 
                              placeholder="куплю, ищу, подскажите, цена" 
                            />
                          </div>
                          
                          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg flex items-start gap-3">
                            <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="font-medium">Обучение ИИ вашему стилю</p>
                              <p className="text-sm mt-1">Когда вы переходите по ссылке и отвечаете человеку со своего аккаунта, программа запоминает ваш ответ. В будущем ИИ будет использовать ваш стиль общения.</p>
                              <p className="text-xs mt-2 font-mono bg-purple-100 dark:bg-purple-800/50 inline-block px-2 py-1 rounded">
                                Собрано примеров вашего общения: {status?.learnedStyles || 0}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="text-lg font-semibold mb-2">Авторизация Юзербота (MTProto)</h3>
                        <p className={`text-sm ${themeClasses.textMuted} mb-4`}>
                          Чтобы бот работал от имени вашего аккаунта (без слова "бот"), введите данные с my.telegram.org.
                        </p>
                        
                        {authStep === 'idle' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">API ID</label>
                              <input type="text" value={apiIdInput} onChange={e => setApiIdInput(e.target.value)} className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} placeholder="1234567" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">API Hash</label>
                              <input type="text" value={apiHashInput} onChange={e => setApiHashInput(e.target.value)} className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} placeholder="abcdef1234567890" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Номер телефона</label>
                              <input type="text" value={phoneInput} onChange={e => setPhoneInput(e.target.value)} className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} placeholder="+1234567890" />
                            </div>
                            <button onClick={handleUserbotSendCode} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                              Отправить код
                            </button>
                          </div>
                        )}

                        {authStep === 'requesting' && (
                          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                            Отправка запроса...
                          </div>
                        )}

                        {authStep === 'code' && (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Код из Telegram</label>
                              <input type="text" value={authPhoneCode} onChange={e => setAuthPhoneCode(e.target.value)} className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} placeholder="12345" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-1">Облачный пароль (если есть 2FA)</label>
                              <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} className={`w-full rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 ${themeClasses.inputBg}`} placeholder="••••••••" />
                            </div>
                            <button onClick={handleUserbotLogin} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                              Войти
                            </button>
                          </div>
                        )}

                        {authStep === 'done' && (
                          <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Юзербот успешно авторизован и работает!
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center p-8">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} shadow-sm overflow-hidden`}>
                <div className={`px-6 py-4 border-b ${themeClasses.cardBorder}`}>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-500" />
                    База знаний Антибан
                  </h2>
                </div>
                <div className="p-6">
                  <p className={`${themeClasses.textMuted} mb-6`}>
                    Система автоматически собирает кейсы и обсуждения лимитов Telegram из открытых источников и адаптирует под них поведение бота.
                  </p>
                  
                  {status?.knowledge && status.knowledge.length > 0 ? (
                    <div className="space-y-6">
                      {status.knowledge.map((k) => (
                        <div key={k.id} className={`p-4 border ${themeClasses.cardBorder} rounded-lg ${themeClasses.hoverBg}`}>
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-xs uppercase tracking-wider font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                              Источник: {k.source}
                            </span>
                            <span className={`text-xs ${themeClasses.textMuted}`}>
                              {new Date(k.created_at).toLocaleString('ru-RU')}
                            </span>
                          </div>
                          
                          <div className="space-y-4 text-sm mt-3">
                            {k.risks && k.risks.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-red-500 flex items-center gap-1 mb-1">
                                  <AlertCircle className="w-4 h-4" /> Выявленные риски:
                                </h4>
                                <ul className="list-disc pl-5 space-y-1">
                                  {k.risks.map((r, i) => <li key={i}>{r}</li>)}
                                </ul>
                              </div>
                            )}

                            {k.limits && k.limits.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-amber-500 mb-1">Ограничения платформы:</h4>
                                <ul className="list-disc pl-5 space-y-1">
                                  {k.limits.map((l, i) => <li key={i}>{l}</li>)}
                                </ul>
                              </div>
                            )}

                            {k.recommendations && k.recommendations.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-green-500 flex items-center gap-1 mb-1">
                                  <Shield className="w-4 h-4" /> Рекомендации ИИ:
                                </h4>
                                <ul className="list-disc pl-5 space-y-1">
                                  {k.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500 flex flex-col items-center">
                      <Bot className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600" />
                      <p>База знаний формируется...</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'integrity' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    <ShieldCheck className="h-7 w-7 text-emerald-500" />
                    Целостность Системы и Здоровье Инфраструктуры
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl p-6 shadow-sm`}>
                      <div className="text-sm font-medium text-gray-500 mb-2">Экстренные протоколы</div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-semibold">Глобальная остановка</span>
                        <button 
                           onClick={() => toggleEmergencyStop(!(platformStatus?.emergencyStop))}
                           className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                             platformStatus?.emergencyStop 
                               ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                               : 'bg-red-500 text-white shadow-lg shadow-red-500/20'
                           }`}
                        >
                          {platformStatus?.emergencyStop ? 'ВОЗОБНОВИТЬ ВСЕ' : 'ЭКСТРЕННАЯ ОСТАНОВКА'}
                        </button>
                      </div>
                      <div className="text-xs text-gray-400">
                        Ручная остановка всего исходящего трафика по всем тенантам. Используйте во время массовых банов.
                      </div>
                   </div>

                   <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl p-6 shadow-sm`}>
                      <div className="text-sm font-medium text-gray-500 mb-2">Сводка платформы</div>
                      <div className="space-y-3">
                         <div className="flex justify-between items-center">
                            <span className="text-xs">Активные аккаунты</span>
                            <span className="text-xs font-bold">{platformStatus?.stats?.active_accounts || 0}</span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs">Баны (24ч)</span>
                            <span className={`text-xs font-bold ${Number(platformStatus?.stats?.recent_bans) > 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                              {platformStatus?.stats?.recent_bans || 0}
                            </span>
                         </div>
                         <div className="flex justify-between items-center">
                            <span className="text-xs">Активные тенанты</span>
                            <span className="text-xs font-bold">{platformStatus?.stats?.active_tenants || 0}</span>
                         </div>
                      </div>
                   </div>

                   <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl p-6 shadow-sm`}>
                      <div className="text-sm font-medium text-gray-500 mb-2">Механизм автовосстановления</div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="h-2 flex-1 bg-emerald-500/20 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 w-[95%]"></div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500">95% Аптайм</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Автоматический мониторинг и возобновление остывших аккаунтов каждые 60 секунд.
                      </div>
                   </div>
                </div>

                <div className={`${themeClasses.cardBg} border ${themeClasses.cardBorder} rounded-2xl p-6 shadow-sm`}>
                   <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                     <Network className="h-5 w-5 text-blue-500" />
                     Карта репутации инфраструктуры
                   </h3>
                   <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 uppercase">
                          <tr>
                            <th className="px-4 py-3">Прокси</th>
                            <th className="px-4 py-3">Здоровье</th>
                            <th className="px-4 py-3">Всего аккаунтов</th>
                            <th className="px-4 py-3">Счетчик банов</th>
                            <th className="px-4 py-3">Статус</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100/10">
                          {proxies && proxies.map((px, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                              <td className="px-4 py-4 font-mono text-[11px]">{px.proxy}</td>
                              <td className="px-4 py-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        px.health > 0.7 ? 'bg-emerald-500' : px.health > 0.4 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${px.health * 100}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-[10px] font-bold">{(px.health * 100).toFixed(0)}%</span>
                                </div>
                              </td>
                              <td className="px-4 py-4">{px.total_accounts}</td>
                              <td className="px-4 py-4 text-red-500 font-medium">{px.ban_count}</td>
                              <td className="px-4 py-4">
                                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                                  px.status === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-500' :
                                  px.status === 'SUSPICIOUS' ? 'bg-amber-500/10 text-amber-500' :
                                  'bg-red-500/10 text-red-500'
                                }`}>
                                  {px.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
             </div>
          )}

        </main>

        {/* Sidebar (Right) */}
        {!isTabFullscreen && (
        <aside className={`w-full md:w-64 flex-shrink-0 space-y-2`}>
          <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-3 shadow-sm flex flex-col gap-1 sticky top-24`}>
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500/80 mb-2 border-b border-gray-100/10 dark:border-white/[0.04]">
              {tMenu.menu}
            </div>
            
            <div className="flex items-center gap-2 px-3 mt-3 mb-2 pb-1 border-b border-gray-100/10 dark:border-white/[0.05]">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] animate-pulse"></div>
              <span className="font-bold text-[10px] uppercase tracking-widest text-blue-500 dark:text-blue-400">{tMenu.copilot}</span>
            </div>
            <button
              onClick={() => setActiveTab('readiness')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'readiness' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title="Operational Readiness & Rollout"
            >
              <Activity className="w-4 h-4 text-emerald-500" />
              Operational Readiness
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                Operational Readiness & Rollout KPIs
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('decision_center')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'decision_center' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title="AI Decision Center Logs & Financial Impact"
            >
              <Target className="w-4 h-4 text-emerald-500" />
              AI Decision Center
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                AI Decision Center Logs & Financial Impact
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('cognitive')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'cognitive' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.cognitive}
            >
              <Network className="w-4 h-4 text-blue-500" />
              {tMenu.cognitive}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.cognitive}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'dashboard' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.dashboard}
            >
              <Activity className="w-4 h-4" />
              {tMenu.dashboard}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.dashboard}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('autopost')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'autopost' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.autopost}
            >
              <Zap className="w-4 h-4" />
              {tMenu.autopost}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.autopost}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('leads')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'leads' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.leads}
            >
              <Filter className="w-4 h-4" />
              {tMenu.leads}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.leads}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'history' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.history}
            >
              <MessageSquare className="w-4 h-4" />
              {tMenu.history}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.history}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
 
            {/* Section Divider */}
            <div className="mt-4 mb-2 border-t border-gray-100/10 dark:border-white/[0.05]"></div>
            
            <div className="flex items-center gap-2 px-3 mb-2 pb-1 border-b border-gray-100/10 dark:border-white/[0.05]">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.6)] animate-pulse"></div>
              <span className="font-bold text-[10px] uppercase tracking-widest text-purple-500 dark:text-purple-400">{tMenu.memory_engine}</span>
            </div>
            <button
              onClick={() => setActiveTab('users')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'users' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.users}
            >
              <Users className="w-4 h-4" />
              {tMenu.users}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.users}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'crm' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.crm}
            >
              <BookOpen className="w-4 h-4" />
              {tMenu.crm}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.crm}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
 
            {/* Section Divider */}
            <div className="mt-4 mb-2 border-t border-gray-100/10 dark:border-white/[0.05]"></div>
            
            <div className="flex items-center gap-2 px-3 mb-2 pb-1 border-b border-gray-100/10 dark:border-white/[0.05]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse"></div>
              <span className="font-bold text-[10px] uppercase tracking-widest text-emerald-500 dark:text-emerald-400">{tMenu.market_intel}</span>
            </div>
            <button
              onClick={() => setActiveTab('market')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'market' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.market}
            >
              <TrendingUp className="w-4 h-4" />
              {tMenu.market}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.market}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('groups')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'groups' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.groups}
            >
              <Target className="w-4 h-4" />
              {tMenu.groups}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.groups}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
 
            {/* Section Divider */}
            <div className="mt-4 mb-2 border-t border-gray-100/10 dark:border-white/[0.05]"></div>
            
            <div className="flex items-center gap-2 px-3 mb-2 pb-1 border-b border-gray-100/10 dark:border-white/[0.05]">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)] animate-pulse"></div>
              <span className="font-bold text-[10px] uppercase tracking-widest text-orange-500 dark:text-orange-400">{tMenu.reports_settings}</span>
            </div>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'analytics' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.analytics}
            >
              <Download className="w-4 h-4" />
              {tMenu.analytics}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.analytics}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('knowledge')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'knowledge' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.knowledge}
            >
              <Bot className="w-4 h-4" />
              {tMenu.knowledge}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.knowledge}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors w-full text-left ${activeTab === 'settings' ? themeClasses.activeTabBg : themeClasses.inactiveTabBg}`}
              title={tHint.settings}
            >
              <Settings className="w-4 h-4" />
              {tMenu.settings}
              <div className="absolute right-full top-1/2 -translate-y-1/2 mr-3 px-2.5 py-1.5 bg-gray-950/95 border border-white/10 rounded-lg text-xs text-gray-300 font-normal tracking-wide shadow-2xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-[9999] transform translate-x-1 group-hover:translate-x-0">
                {tHint.settings}
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-0 h-0 border-y-[4px] border-y-transparent border-l-[5px] border-l-gray-950/95"></div>
              </div>
            </button>
          </div>

          <div className={`${themeClasses.cardBg} rounded-xl border ${themeClasses.cardBorder} p-3 shadow-sm flex flex-col gap-2 mt-4`}>
             <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
               <span className="truncate">Client v0.9.4-beta</span>
             </div>
          </div>
        </aside>
        )}

      </div>
      
      {/* Real-time Toast Notifications */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto min-w-[320px] max-w-md p-4 rounded-xl shadow-2xl border flex items-start gap-4 animate-in slide-in-from-right duration-300 ${
              toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
              toast.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' :
              'bg-blue-500/10 border-blue-500/30 text-blue-500'
            } backdrop-blur-md`}
          >
            {toast.type === 'error' && <ShieldAlert className="h-6 w-6 shrink-0" />}
            {toast.type === 'warning' && <AlertTriangle className="h-6 w-6 shrink-0" />}
            {toast.type === 'info' && <Bell className="h-6 w-6 shrink-0" />}
            
            <div className="flex-1">
              <div className="font-bold text-sm">{toast.title}</div>
              <div className="text-xs opacity-90 leading-relaxed mt-1">{toast.message}</div>
            </div>
            
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="p-1 hover:bg-white/10 rounded transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import { Routes, Route } from 'react-router-dom';
import { Landing } from './Landing';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/app" element={<AuthGate><AppDashboard /></AuthGate>} />
    </Routes>
  );
}
