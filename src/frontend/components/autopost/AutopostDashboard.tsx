import React, { useReducer } from 'react';
import { 
  Search, Check, Server, Terminal, Play, PauseCircle, Send, ArrowRight, Activity, MessageSquare, Settings, ExternalLink, Save, X, List, Maximize2, Minimize2
} from 'lucide-react';

// --- MOCK DATA ---
type Role = 'owner' | 'participant' | 'other';
interface Endpoint {
  id: string;
  title: string;
  selected: boolean;
  role: Role;
  link: string;
}

const MOCK_SOURCES: Endpoint[] = [
  { id: 'src-1', title: 'ТелеТорг: Покупка...', selected: false, role: 'owner', link: 'https://t.me/teletorg_vip' },
  { id: 'src-2', title: 'Техночат', selected: false, role: 'participant', link: 'https://t.me/technochat_public' },
  { id: 'src-3', title: 'ФЕЛИКС ПОГОСЯН', selected: false, role: 'other', link: 'https://t.me/felix_channel' },
  { id: 'src-4', title: 'پروکسی | Proxy...', selected: false, role: 'other', link: 'https://t.me/proxy_ir' },
  { id: 'src-5', title: 'NLYost, is my world', selected: false, role: 'participant', link: 'https://t.me/nlyost' },
  { id: 'src-6', title: 'CHH__XXXXXXXXXXXX', selected: true, role: 'owner', link: 'https://t.me/ch_xxxx' },
  { id: 'src-7', title: 'CH_0011', selected: true, role: 'owner', link: 'https://t.me/ch_0011' },
];

const MOCK_TARGETS: Endpoint[] = [
  { id: 'tgt-1', title: 'TG__AUSender / To', selected: true, role: 'owner', link: 'https://t.me/ausender' },
  { id: 'tgt-2', title: 'Windows10. SOFT', selected: false, role: 'participant', link: 'https://t.me/win10_soft' },
  { id: 'tgt-3', title: 'Crypto Traders', selected: false, role: 'other', link: 'https://t.me/crypto_trades' },
  { id: 'tgt-4', title: 'My Private Backup', selected: false, role: 'owner', link: 'https://t.me/backup_private' },
  { id: 'tgt-5', title: 'Dev Community', selected: false, role: 'participant', link: 'https://t.me/dev_comm' },
];

interface RouteItem {
  id: string;
  from: Endpoint[];
  to: Endpoint[];
  delay: string;
  selected: boolean;
}

const MOCK_ROUTES: RouteItem[] = [
  { 
      id: 'rt-1', 
      from: [MOCK_SOURCES[5]], 
      to: [MOCK_TARGETS[0]], 
      delay: '10-20', 
      selected: true 
  },
];

// --- STATE MANAGEMENT ---
interface ContextMenuData {
  x: number;
  y: number;
  type: 'sources' | 'targets' | 'routes' | 'replace';
}

interface RouteConfig {
  watermark: boolean;
  priority: boolean;
  deleteWithLinks: boolean;
  replaceLinks: boolean;
  myLink: string;
  aiPhotoGeneration: boolean;
  aiPhotoModel: string;
  aiPhotoPrompt: string;
  replaceEmail: boolean;
  myEmail: string;
  replacePhone: boolean;
  myPhone: string;
  translateAi: boolean;
  translateLanguage: string;
  stopWordsEnabled: boolean;
  stopWordsList: string;
  skipAds: boolean;
  appendTextEnabled: boolean;
  appendTextContent: string;
  anonymizeText: boolean;
  anonymizePercent: number;
}

interface State {
  sources: Endpoint[];
  targets: Endpoint[];
  routes: RouteItem[];
  selectedSources: Set<string>;
  selectedTargets: Set<string>;
  contentTypes: { text: boolean; photo: boolean; video: boolean; document: boolean; };
  replaceTextEnabled: boolean;
  replaceRules: string;
  delay: { min: number; max: number };
  sendMode: 'Forward' | 'Send Copy' | 'Replacing Text';
  searchSource: string;
  searchTarget: string;
  activePreview: Endpoint[] | null;
  settingsOpenForRoute: string | null;
  isAutoposting: boolean;
  savedChatsEnabled: boolean;
  contextMenu: ContextMenuData | null;
  routeConfig: RouteConfig;
}

type Action = 
  | { type: 'TOGGLE_SOURCE'; payload: string }
  | { type: 'TOGGLE_TARGET'; payload: string }
  | { type: 'TOGGLE_CONTENT'; payload: keyof State['contentTypes'] }
  | { type: 'TOGGLE_REPLACE'; payload: boolean }
  | { type: 'SET_DELAY'; payload: { field: 'min' | 'max'; value: number } }
  | { type: 'SET_SEND_MODE'; payload: State['sendMode'] }
  | { type: 'SET_SEARCH_SOURCE'; payload: string }
  | { type: 'SET_SEARCH_TARGET'; payload: string }
  | { type: 'ADD_ROUTE' }
  | { type: 'SET_REPLACE_RULES'; payload: string }
  | { type: 'SET_ACTIVE_PREVIEW'; payload: Endpoint[] | null }
  | { type: 'OPEN_ROUTE_SETTINGS'; payload: string | null }
  | { type: 'TOGGLE_AUTOPOSTING' }
  | { type: 'TOGGLE_SAVED_CHATS' }
  | { type: 'OPEN_MENU'; payload: ContextMenuData }
  | { type: 'CLOSE_MENU' }
  | { type: 'UPDATE_ROUTE_CONFIG'; payload: Partial<RouteConfig> }
  | { type: 'SELECT_ALL_SOURCES'; payload: string[] }
  | { type: 'INVERT_SOURCES'; payload: string[] }
  | { type: 'SELECT_ALL_TARGETS'; payload: string[] }
  | { type: 'INVERT_TARGETS'; payload: string[] }
  | { type: 'SELECT_ALL_ROUTES' }
  | { type: 'DELETE_SELECTED_ROUTES' }
  | { type: 'DELETE_SELECTED_SOURCES' };

const initialState: State = {
  sources: MOCK_SOURCES,
  targets: MOCK_TARGETS,
  routes: MOCK_ROUTES,
  selectedSources: new Set(MOCK_SOURCES.filter(s => s.selected).map(s => s.id)),
  selectedTargets: new Set(MOCK_TARGETS.filter(t => t.selected).map(t => t.id)),
  contentTypes: { text: true, photo: true, video: true, document: false },
  replaceTextEnabled: true,
  replaceRules: '',
  delay: { min: 10, max: 20 },
  sendMode: 'Send Copy',
  searchSource: '',
  searchTarget: '',
  activePreview: null,
  settingsOpenForRoute: null,
  isAutoposting: false,
  savedChatsEnabled: false,
  contextMenu: null,
  routeConfig: {
    watermark: false,
    priority: true,
    deleteWithLinks: false,
    replaceLinks: false,
    myLink: 'https://',
    aiPhotoGeneration: false,
    aiPhotoModel: 'gemini-1.5-pro',
    aiPhotoPrompt: 'Профессиональное фото товара, студийный свет',
    replaceEmail: false,
    myEmail: 'contact@mycompany.com',
    replacePhone: false,
    myPhone: '+7 (999) 000-00-00',
    translateAi: false,
    translateLanguage: 'English',
    stopWordsEnabled: false,
    stopWordsList: 'реклама, спонсор, купить',
    skipAds: false,
    appendTextEnabled: false,
    appendTextContent: 'Подписывайтесь: https://t.me/mychannel',
    anonymizeText: false,
    anonymizePercent: 80,
  }
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'UPDATE_ROUTE_CONFIG': return { ...state, routeConfig: { ...state.routeConfig, ...action.payload } };
    case 'OPEN_MENU': return { ...state, contextMenu: action.payload };
    case 'CLOSE_MENU': return { ...state, contextMenu: null };
    case 'TOGGLE_SOURCE': {
      const next = new Set(state.selectedSources);
      next.has(action.payload) ? next.delete(action.payload) : next.add(action.payload);
      const sourceObj = state.sources.find(s => s.id === action.payload);
      return { ...state, selectedSources: next, activePreview: sourceObj ? [sourceObj] : null };
    }
    case 'TOGGLE_TARGET': {
      const next = new Set(state.selectedTargets);
      next.has(action.payload) ? next.delete(action.payload) : next.add(action.payload);
      const targetObj = state.targets.find(t => t.id === action.payload);
      return { ...state, selectedTargets: next, activePreview: targetObj ? [targetObj] : null };
    }
    case 'SELECT_ALL_SOURCES': {
      const next = new Set(state.selectedSources);
      (action.payload as string[]).forEach(id => next.add(id));
      return { ...state, selectedSources: next };
    }
    case 'INVERT_SOURCES': {
      const next = new Set(state.selectedSources);
      (action.payload as string[]).forEach(id => {
          if (next.has(id)) next.delete(id);
          else next.add(id);
      });
      return { ...state, selectedSources: next };
    }
    case 'SELECT_ALL_TARGETS': {
      const next = new Set(state.selectedTargets);
      (action.payload as string[]).forEach(id => next.add(id));
      return { ...state, selectedTargets: next };
    }
    case 'INVERT_TARGETS': {
      const next = new Set(state.selectedTargets);
      (action.payload as string[]).forEach(id => {
          if (next.has(id)) next.delete(id);
          else next.add(id);
      });
      return { ...state, selectedTargets: next };
    }
    case 'SELECT_ALL_ROUTES': {
      // NOTE: Here "SELECT_ALL_ROUTES" means we set "selected" property to true for all routes.
      // Since it's mockup, let's just update all routes selected: true
      return { ...state, routes: state.routes.map(r => ({ ...r, selected: true })) };
    }
    case 'DELETE_SELECTED_ROUTES': {
      return { ...state, routes: state.routes.filter(r => !r.selected) };
    }
    case 'DELETE_SELECTED_SOURCES': {
      return { ...state, sources: state.sources.filter(s => !state.selectedSources.has(s.id)), selectedSources: new Set() };
    }
    case 'TOGGLE_CONTENT': return { ...state, contentTypes: { ...state.contentTypes, [action.payload]: !state.contentTypes[action.payload] } };
    case 'TOGGLE_REPLACE': return { ...state, replaceTextEnabled: action.payload };
    case 'SET_REPLACE_RULES': return { ...state, replaceRules: action.payload };
    case 'SET_DELAY': return { ...state, delay: { ...state.delay, [action.payload.field]: action.payload.value } };
    case 'SET_SEND_MODE': return { ...state, sendMode: action.payload };
    case 'SET_SEARCH_SOURCE': return { ...state, searchSource: action.payload };
    case 'SET_SEARCH_TARGET': return { ...state, searchTarget: action.payload };
    case 'SET_ACTIVE_PREVIEW': return { ...state, activePreview: action.payload };
    case 'OPEN_ROUTE_SETTINGS': return { ...state, settingsOpenForRoute: action.payload };
    case 'TOGGLE_AUTOPOSTING': return { ...state, isAutoposting: !state.isAutoposting };
    case 'TOGGLE_SAVED_CHATS': return { ...state, savedChatsEnabled: !state.savedChatsEnabled };
    case 'ADD_ROUTE': {
        if (state.selectedSources.size === 0 || state.selectedTargets.size === 0) return state;
        
        const fromItems = Array.from(state.selectedSources).map(id => state.sources.find(s => s.id === id)).filter(Boolean) as Endpoint[];
        const toItems = Array.from(state.selectedTargets).map(id => state.targets.find(t => t.id === id)).filter(Boolean) as Endpoint[];
        
        const newRoute: RouteItem = {
            id: `rt-${Date.now()}`,
            from: fromItems,
            to: toItems,
            delay: `${state.delay.min}-${state.delay.max}`,
            selected: true
        };
        
        return { ...state, routes: [...state.routes, newRoute], selectedSources: new Set(), selectedTargets: new Set() };
    }
    default: return state;
  }
}

// --- COMPONENTS ---
export const AutopostDashboard = ({ 
  settings,
  setSettings,
  themeClasses,
  isTabFullscreen, 
  setIsTabFullscreen 
}: { 
  settings?: any;
  setSettings?: any;
  themeClasses?: any;
  isTabFullscreen?: boolean; 
  setIsTabFullscreen?: (val: boolean) => void; 
} = {}) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [configTab, setConfigTab] = React.useState<'general' | 'ai' | 'replace' | 'processing'>('general');
  const [expandedOptions, setExpandedOptions] = React.useState<Record<string, boolean>>({});

  const toggleOption = (key: string) => setExpandedOptions(p => ({ ...p, [key]: !p[key] }));

  const filteredSources = state.sources.filter(s => s.title.toLowerCase().includes(state.searchSource.toLowerCase()));
  const filteredTargets = state.targets.filter(t => t.title.toLowerCase().includes(state.searchTarget.toLowerCase()));

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a' || e.key === 'A') {
          e.preventDefault();
          dispatch({ type: 'SELECT_ALL_SOURCES', payload: filteredSources.map(s => s.id) });
          dispatch({ type: 'SELECT_ALL_TARGETS', payload: filteredTargets.map(t => t.id) });
        }
        if (e.key === 'i' || e.key === 'I') {
          e.preventDefault();
          dispatch({ type: 'INVERT_SOURCES', payload: filteredSources.map(s => s.id) });
          dispatch({ type: 'INVERT_TARGETS', payload: filteredTargets.map(t => t.id) });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredSources, filteredTargets]);

  // UI helpers
  const Checkbox = ({ label, checked, onChange, isRadio = false }: { label: string, checked: boolean, onChange: () => void, isRadio?: boolean }) => (
    <label className="flex items-center gap-2 cursor-pointer text-[#a5a5a5] hover:text-[#d0d0d0] group select-none text-[11px] font-sans">
      <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
      <div className={`flex items-center justify-center border transition-colors flex-shrink-0 ${checked ? (isRadio ? 'border-[#3b82f6] bg-transparent' : 'bg-[#153460] border-[#3b82f6]') : 'bg-[#181818] border-[#444] group-hover:border-[#666]'} ${isRadio ? 'w-3.5 h-3.5 rounded-full' : 'w-3.5 h-3.5 rounded-[2px]'}`}>
        {(checked && !isRadio) && <Check size={11} className="text-[#60a5fa] stroke-[3]" />}
        {(checked && isRadio) && <div className="w-[6px] h-[6px] rounded-full bg-[#60a5fa]" />}
      </div>
      <span className={checked ? "text-[#e0e0e0]" : "text-[#a0a0a0]"}>{label}</span>
    </label>
  );

  // Проверка подключения аккаунта
  React.useEffect(() => {
    fetch('/api/accounts')
      .then(r => r.ok ? r.json() : [])
      .then((accounts: any[]) => {
        if (accounts && accounts.length > 0) {
          const sources = accounts.map((a: any, i: number) => ({
            id: `acc-${a.id || i}`,
            title: a.username || a.phone || `Аккаунт ${i+1}`,
            selected: false,
            role: 'owner' as Role,
            link: a.username ? `https://t.me/${a.username}` : '#'
          }));
          dispatch({ type: 'SET_SOURCES', payload: sources });
        }
      })
      .catch(() => {});
    fetch('/api/status')
      .then(r => r.ok ? r.json() : null)
      .then((status: any) => {
        if (status?.groups && status.groups.length > 0) {
          const targets = status.groups.map((g: any, i: number) => ({
            id: `grp-${g.id || i}`,
            title: g.title || g.channel_id || `Группа ${i+1}`,
            selected: false,
            role: 'participant' as Role,
            link: g.username ? `https://t.me/${g.username}` : '#'
          }));
          dispatch({ type: 'SET_TARGETS', payload: targets });
        }
      })
      .catch(() => {});
  }, []);

  if (state.sources.length === 0 && state.targets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#181818] text-[#cccccc] p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Аккаунт не подключён</h2>
        <p className="text-[#666] text-sm max-w-sm mb-6">
          Для работы автопостинга необходимо подключить Telegram аккаунт (userbot) через MTProto. Перейдите в настройки и добавьте аккаунт.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-4 text-left">
            <div className="text-xs text-[#3b82f6] font-mono uppercase tracking-wider mb-2">Как подключить</div>
            <ol className="text-xs text-[#888] space-y-1.5 list-decimal list-inside">
              <li>Перейдите в <span className="text-[#aaa]">Настройки → Telegram Layer</span></li>
              <li>Введите номер телефона аккаунта</li>
              <li>Подтвердите код из Telegram</li>
              <li>Аккаунт появится в списке источников</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // Проверка подключения аккаунта
  React.useEffect(() => {
    fetch('/api/accounts')
      .then(r => r.ok ? r.json() : [])
      .then((accounts: any[]) => {
        if (accounts && accounts.length > 0) {
          const sources = accounts.map((a: any, i: number) => ({
            id: `acc-${a.id || i}`,
            title: a.username || a.phone || `Аккаунт ${i+1}`,
            selected: false,
            role: 'owner' as Role,
            link: a.username ? `https://t.me/${a.username}` : '#'
          }));
          dispatch({ type: 'SET_SOURCES', payload: sources });
        }
      })
      .catch(() => {});
    fetch('/api/status')
      .then(r => r.ok ? r.json() : null)
      .then((status: any) => {
        if (status?.groups && status.groups.length > 0) {
          const targets = status.groups.map((g: any, i: number) => ({
            id: `grp-${g.id || i}`,
            title: g.title || g.channel_id || `Группа ${i+1}`,
            selected: false,
            role: 'participant' as Role,
            link: g.username ? `https://t.me/${g.username}` : '#'
          }));
          dispatch({ type: 'SET_TARGETS', payload: targets });
        }
      })
      .catch(() => {});
  }, []);

  if (state.sources.length === 0 && state.targets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#181818] text-[#cccccc] p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[#1e1e1e] border border-[#2a2a2a] flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-[#3b82f6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Аккаунт не подключён</h2>
        <p className="text-[#666] text-sm max-w-sm mb-6">
          Для работы автопостинга необходимо подключить Telegram аккаунт (userbot) через MTProto. Перейдите в настройки и добавьте аккаунт.
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-4 text-left">
            <div className="text-xs text-[#3b82f6] font-mono uppercase tracking-wider mb-2">Как подключить</div>
            <ol className="text-xs text-[#888] space-y-1.5 list-decimal list-inside">
              <li>Перейдите в <span className="text-[#aaa]">Настройки → Telegram Layer</span></li>
              <li>Введите номер телефона аккаунта</li>
              <li>Подтвердите код из Telegram</li>
              <li>Аккаунт появится в списке источников</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#181818] text-[#cccccc] font-sans selection:bg-[#3b82f6]/30 overflow-hidden border border-[#2a2a2a] shadow-lg rounded-sm relative">
      
      {/* QUICK PREVIEW / NAVIGATION BAR */}
      <div className="h-9 shrink-0 bg-[#0d0d0d] border-b border-[#2d2d2d] flex items-center px-4 overflow-x-auto gap-4">
          <div className="text-[10px] text-[#555] font-bold tracking-widest uppercase whitespace-nowrap">
             НАВИГАТОР &rarr;
          </div>
          <div className="flex-1 flex items-center gap-2">
             {state.activePreview && state.activePreview.length > 0 ? (
                 state.activePreview.map(item => (
                     <a 
                         key={item.id}
                         href={item.link} 
                         target="_blank" 
                         rel="noreferrer"
                         className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-bold border hover:bg-[#252525] transition-all
                            ${item.role === 'owner' ? 'bg-transparent text-[#60a5fa] border-[#60a5fa]/30' : 
                              item.role === 'participant' ? 'bg-transparent text-[#34d399] border-[#34d399]/30' : 
                              'bg-transparent text-[#a1a1aa] border-[#a1a1aa]/30'}`}
                     >
                        {item.title} <ExternalLink size={10} />
                     </a>
                 ))
             ) : (
                 <span className="text-[10px] text-[#555] italic">Выберите группу или маршрут для генерации ссылок TG</span>
             )}
          </div>
          
          <button 
             onClick={() => dispatch({type: 'TOGGLE_SAVED_CHATS'})}
             className={`flex items-center gap-1.5 px-3 py-1 rounded text-[10px] border font-bold transition-all whitespace-nowrap
               ${state.savedChatsEnabled ? 'bg-[#1e3a8a]/20 text-[#60a5fa] border-[#1e40af]' : 'bg-[#1a1a1a] text-[#888] border-[#333] hover:bg-[#252525]'}`}
          >
             <Save size={12} /> {state.savedChatsEnabled ? "Чаты Сохранены" : "Сохранить выбранные чаты"}
          </button>
          
          {setIsTabFullscreen && (
             <button 
                onClick={() => setIsTabFullscreen(!isTabFullscreen)}
                className="flex items-center justify-center p-1.5 h-[23px] px-2.5 rounded text-[10px] bg-blue-600 hover:bg-blue-700 text-white border border-blue-500 hover:scale-[1.03] active:scale-95 transition-all whitespace-nowrap gap-1 font-bold shadow-sm cursor-pointer"
                title={isTabFullscreen ? "Свернуть" : "Увеличить на весь экран"}
             >
                {isTabFullscreen ? <Minimize2 size={11} /> : <Maximize2 size={11} />}
                <span>{isTabFullscreen ? "Свернуть" : "Увеличить"}</span>
             </button>
          )}
      </div>

      {/* TOP WORKSPACE AREA */}
      <div className="flex flex-1 min-h-[300px] gap-1 p-1 pb-0 overflow-hidden">
        
        {/* FROM PANEL (resizable via CSS tailwind classes) */}
        <div className="w-[220px] min-w-[150px] max-w-[400px] shrink-0 flex flex-col bg-[#141414] border border-[#2d2d2d] rounded-sm resize-x overflow-hidden relative">
           <div className="h-6 bg-gradient-to-b from-[#2a2a2a] to-[#1e1e1e] flex items-center px-2 text-[11px] font-bold shadow-sm shrink-0 border-b border-[#0a0a0a]">
              Из : 1 - {state.sources.length}
           </div>
           <div 
               className="flex-1 overflow-y-auto custom-scrollbar p-1"
               onContextMenu={(e) => { e.preventDefault(); dispatch({type: 'OPEN_MENU', payload: {x: e.clientX, y: e.clientY, type: 'sources'}}); }}
           >
               {filteredSources.map(src => {
                   const isSelected = state.selectedSources.has(src.id);
                   return (
                       <div 
                         key={src.id}
                         onClick={() => dispatch({type: 'TOGGLE_SOURCE', payload: src.id})}
                         className={`flex items-center gap-1.5 p-1 cursor-pointer text-[11px] border border-transparent ${isSelected ? 'bg-[#1e2f4c]/80 border-[#2a4570] text-blue-200' : 'hover:bg-[#252525] text-[#888]'}`}
                       >
                         <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 border ${isSelected ? 'bg-[#0f2142] border-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-[#111] border-[#333]'}`}>
                            {isSelected && <Check size={8} strokeWidth={3} className="text-[#60a5fa]"/>}
                         </div>
                         <MessageSquare size={10} className={`shrink-0 ${isSelected ? 'text-[#60a5fa]' : 'text-[#555]'}`} />
                         <span className="truncate">{src.title}</span>
                         {/* Role dot indicator */}
                         <div className={`ml-auto shrink-0 w-1.5 h-1.5 rounded-full ${src.role === 'owner' ? 'bg-blue-500' : src.role === 'participant' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                       </div>
                   )
               })}
           </div>
           <div className="h-6 bg-[#1a1a1a] flex items-center px-1.5 shrink-0 border-t border-[#2d2d2d]">
              <Search size={12} className="text-[#555] mr-1.5 shrink-0"/>
              <input type="text" placeholder="Источники" value={state.searchSource} onChange={e => dispatch({type: 'SET_SEARCH_SOURCE', payload: e.target.value})} className="bg-transparent border-none outline-none text-[10px] w-full text-white placeholder-[#555]"/>
           </div>
           <div className="absolute top-[2px] right-0 bottom-0 cursor-ew-resize w-1 hover:bg-[#3b82f6]/20 z-10"></div>
        </div>

        {/* TO PANEL (resizable via CSS tailwind classes) */}
        <div className="w-[220px] min-w-[150px] max-w-[400px] shrink-0 flex flex-col bg-[#141414] border border-[#2d2d2d] rounded-sm resize-x overflow-hidden relative">
           <div className="h-6 bg-gradient-to-b from-[#2a2a2a] to-[#1e1e1e] flex items-center px-2 text-[11px] font-bold shadow-sm shrink-0 border-b border-[#0a0a0a]">
              В : 1 - {state.targets.length}
           </div>
           <div 
               className="flex-1 overflow-y-auto custom-scrollbar p-1"
               onContextMenu={(e) => { e.preventDefault(); dispatch({type: 'OPEN_MENU', payload: {x: e.clientX, y: e.clientY, type: 'targets'}}); }}
           >
               {filteredTargets.map(tgt => {
                   const isSelected = state.selectedTargets.has(tgt.id);
                   return (
                       <div 
                         key={tgt.id}
                         onClick={() => dispatch({type: 'TOGGLE_TARGET', payload: tgt.id})}
                         className={`flex items-center gap-1.5 p-1 cursor-pointer text-[11px] border border-transparent ${isSelected ? 'bg-[#15342a]/80 border-[#2b614d] text-emerald-200' : 'hover:bg-[#252525] text-[#888]'}`}
                       >
                         <div className={`w-3.5 h-3.5 rounded-[2px] flex items-center justify-center shrink-0 border ${isSelected ? 'bg-[#0b271d] border-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-[#111] border-[#333]'}`}>
                            {isSelected && <Check size={10} strokeWidth={3} className="text-[#34d399] relative top-[0.5px]"/>}
                         </div>
                         <Terminal size={10} className={`shrink-0 ${isSelected ? 'text-[#34d399]' : 'text-[#555]'}`} />
                         <span className="flex-1 truncate">{tgt.title}</span>
                         <div className={`ml-auto shrink-0 w-1.5 h-1.5 rounded-full ${tgt.role === 'owner' ? 'bg-blue-500' : tgt.role === 'participant' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                       </div>
                   )
               })}
           </div>
           <div className="h-6 bg-[#1a1a1a] flex items-center px-1.5 shrink-0 border-t border-[#2d2d2d]">
              <Search size={12} className="text-[#555] mr-1.5 shrink-0"/>
              <input type="text" placeholder="Получатели" value={state.searchTarget} onChange={e => dispatch({type: 'SET_SEARCH_TARGET', payload: e.target.value})} className="bg-transparent border-none outline-none text-[10px] w-full text-white placeholder-[#555]"/>
           </div>
           <div className="absolute top-[2px] right-0 bottom-0 cursor-ew-resize w-1 hover:bg-[#3b82f6]/20 z-10"></div>
        </div>

        {/* MIDDLE ADD BUTTON */}
        <div className="w-[32px] shrink-0 flex flex-col items-center justify-center bg-[#181818] px-1 relative z-10">
            <div className="absolute top-[30%] -rotate-90 text-[9px] font-bold tracking-[0.2em] text-[#666] whitespace-nowrap bg-[#181818] px-2 border border-[#333] rounded">МАРШРУТЫ</div>
            <button 
                onClick={() => dispatch({type: 'ADD_ROUTE'})}
                className="w-8 h-8 rounded border border-[#333] bg-gradient-to-b from-[#2a2a2a] to-[#1e1e1e] hover:brightness-125 flex items-center justify-center shadow-[0_0_10px_rgba(0,0,0,0.8)] active:translate-y-[1px] transition-all"
            >
               <ArrowRight size={14} className="text-[#9d4edd] opacity-80 drop-shadow-[0_0_5px_rgba(157,78,221,0.6)]" />
            </button>
        </div>

        {/* ROUTES TABLE */}
        <div className="flex-1 min-w-[300px] flex flex-col bg-[#141414] border border-[#2d2d2d] rounded-sm mr-1 overflow-hidden">
            <div className="h-6 bg-gradient-to-b from-[#2a2a2a] to-[#1e1e1e] flex items-center px-2 text-[11px] font-bold shadow-sm shrink-0 border-b border-[#0a0a0a]">
                <div className="flex-1 grid grid-cols-[20px_1fr_1fr_40px] items-center text-[#ccc]">
                    <span className="border-r border-[#444] px-1 text-[10px]">&nbsp;</span>
                    <span className="border-r border-[#444] px-2">Откуда</span>
                    <span className="border-r border-[#444] px-2">Целевая Группа</span>
                    <span className="px-2 text-right">⇅</span>
                </div>
            </div>
            
            <div 
                className="flex-1 overflow-y-auto custom-scrollbar p-1 bg-[#050505]"
                onContextMenu={(e) => { e.preventDefault(); dispatch({type: 'OPEN_MENU', payload: {x: e.clientX, y: e.clientY, type: 'routes'}}); }}
            >
                {state.routes.map(r => (
                    <div 
                        key={r.id} 
                        onClick={() => {
                            dispatch({type: 'SET_ACTIVE_PREVIEW', payload: [...r.from, ...r.to]});
                            dispatch({type: 'OPEN_ROUTE_SETTINGS', payload: r.id});
                        }}
                        className="grid grid-cols-[20px_1fr_1fr_40px] items-center h-6 hover:bg-[#1a2c47] cursor-pointer text-[11px] border border-transparent hover:border-[#2a4570] transition-colors rounded-sm pl-1 pr-2 mb-[1px] group"
                    >
                        <div className="flex items-center justify-center h-full border-r border-[#222]">
                           <div className="w-[11px] h-[11px] rounded-full bg-[#1e2f4c] border border-[#3b82f6] flex items-center justify-center"><Check size={8} className="text-[#60a5fa]"/></div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[#888] truncate border-r border-[#222] h-full px-2">
                           <MessageSquare size={10} className="shrink-0" />
                           <span className="truncate">{r.from[0]?.title || 'Unknown'} {r.from.length > 1 ? `(+${r.from.length-1})` : ''}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-blue-300 truncate h-full px-2">
                           <Terminal size={10} className="shrink-0 text-white opacity-60" />
                           <span className="truncate">{r.to[0]?.title || 'Unknown'} {r.to.length > 1 ? `(+${r.to.length-1})` : ''}</span>
                        </div>
                        <div className="text-right text-[#666] text-[10px] tracking-tighter self-center">
                           {r.delay}
                        </div>
                    </div>
                ))}
            </div>

            <div className="h-6 bg-[#1a1a1a] flex items-center px-1.5 shrink-0 border-t border-[#2d2d2d]">
              <Search size={12} className="text-[#555] mr-1.5 shrink-0"/>
              <span className="text-[10px] text-[#666]">Источники и получатели</span>
              <span className="ml-auto text-[9px] text-[#444] px-2 italic">Кликните по маршруту для настройки</span>
           </div>
        </div>

      </div>

      {/* BOTTOM CONTROL PANEL */}
      <div className="h-[140px] shrink-0 border-t border-[#2a2a2a] bg-[#1a1a1a] flex p-2 gap-4">
          
          {/* MEDIA SELECTION */}
          <div className="w-[140px] flex flex-col gap-1.5 justify-center shrink-0">
             <Checkbox label="Текст" checked={state.contentTypes.text} onChange={() => dispatch({type: 'TOGGLE_CONTENT', payload: 'text'})} />
             <div className="flex items-center gap-4">
                 <Checkbox label="Фото" checked={state.contentTypes.photo} onChange={() => dispatch({type: 'TOGGLE_CONTENT', payload: 'photo'})} />
                 <Checkbox label="Документ" checked={state.contentTypes.document} onChange={() => dispatch({type: 'TOGGLE_CONTENT', payload: 'document'})} />
             </div>
             <Checkbox label="Видео" checked={state.contentTypes.video} onChange={() => dispatch({type: 'TOGGLE_CONTENT', payload: 'video'})} />
             
             <div className="flex gap-2.5 mt-2">
                 <div className="w-7 h-7 rounded border border-[#30363d] bg-gradient-to-b from-[#252525] to-[#151515] flex items-center justify-center hover:bg-[#333] cursor-pointer shadow-inner">
                     <div className="flex gap-[1px]">
                         <span className="text-blue-500 font-bold text-[12px] uppercase">A</span>
                         <span className="text-blue-500 text-[10px] uppercase align-super mt-[-2px]">1</span>
                     </div>
                 </div>
                 <div className="w-7 h-7 rounded border border-[#30363d] bg-gradient-to-b from-[#252525] to-[#151515] flex items-center justify-center hover:bg-[#333] cursor-pointer shadow-inner">
                     <Play size={12} fill="currentColor" className="text-blue-500" />
                 </div>
             </div>
          </div>

          {/* EDIT REPLACE TERMINAL */}
          <div className="flex-1 max-w-[450px] shrink-0 bg-[#0a0a0a] border border-[#333] rounded overflow-hidden flex flex-col relative shadow-[inset_0_2px_10px_rgba(0,0,0,0.8)]">
              <div className="h-6 bg-[#1a1a1a] border-b border-[#333] flex items-center px-2 gap-2 w-full absolute top-0 left-0 bg-gradient-to-b from-[#252525] to-[#151515]">
                 <List 
                     size={14} 
                     className="text-[#888] hover:text-[#ccc] cursor-pointer shrink-0" 
                     onClick={(e) => { e.stopPropagation(); dispatch({type: 'OPEN_MENU', payload: {x: e.clientX, y: e.clientY, type: 'replace'}}); }} 
                 />
                 <Checkbox label="Редакт. Замена" checked={state.replaceTextEnabled} onChange={() => dispatch({type: 'TOGGLE_REPLACE', payload: !state.replaceTextEnabled})} />
                 <div className="bg-[#111] px-1.5 py-0.5 rounded text-[#555] text-[9px] font-mono border border-[#222] ml-4">C:\</div>
                 <div className="ml-auto w-4 h-4 rounded bg-[#111] border border-[#333] flex items-center justify-center"><Terminal size={10} className="text-[#666]"/></div>
              </div>
              <textarea 
                  className="w-full flex-1 mt-6 bg-transparent resize-none text-[11px] text-[#00ffcc] font-mono p-2 outline-none border-none placeholder-[#333]" 
                  placeholder={state.replaceTextEnabled ? "Правило: s/spam/clean/g\nШаблон [A-Z]+" : ""}
                  value={state.replaceRules}
                  onChange={e => dispatch({type: 'SET_REPLACE_RULES', payload: e.target.value})}
                  disabled={!state.replaceTextEnabled}
              />
              <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-r border-b border-[#444]"></div>
          </div>

          {/* DELAY CONTROLS */}
          <div className="w-[200px] shrink-0 border-l border-r border-[#222] px-3 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-3">
                  <span className="text-[#a5a5a5] text-[11px]">Задержка</span>
                  <div className="flex flex-col gap-2 items-center text-[#555]">
                      <ArrowRight size={10} />
                      <div className="w-3 h-[1px] bg-[#555]" />
                  </div>
                  <div className="flex flex-col gap-1 w-[45px]">
                      <input 
                         type="number" 
                         value={state.delay.min}
                         onChange={e => dispatch({type: 'SET_DELAY', payload: {field: 'min', value: Number(e.target.value)}})}
                         className="bg-[#050505] border border-[#333] rounded px-1 py-1 text-center text-[11px] text-[#ccc] outline-none shadow-inner" 
                      />
                      <input 
                         type="number" 
                         value={state.delay.max}
                         onChange={e => dispatch({type: 'SET_DELAY', payload: {field: 'max', value: Number(e.target.value)}})}
                         className="bg-[#050505] border border-[#333] rounded px-1 py-1 text-center text-[11px] text-[#ccc] outline-none shadow-inner" 
                      />
                  </div>
              </div>
              <div className="flex items-center gap-2 text-[#3b82f6] text-[11px] font-bold">
                 <Check size={14} className="stroke-[3]" />
                 <span>{state.delay.min} сек. &rarr; {state.delay.max} сек.</span>
                 <Checkbox label="" checked={true} onChange={() => {}} />
                 <ArrowRight size={12} className="stroke-[3]" />
              </div>
          </div>

          {/* SEND MODES & DISPATCH */}
          <div className="flex-1 flex items-center justify-between pl-2">
              <div className="flex flex-col gap-1.5 justify-center">
                  <Checkbox label="Переслать из .." isRadio={true} checked={state.sendMode === 'Forward'} onChange={() => dispatch({type: 'SET_SEND_MODE', payload: 'Forward'})} />
                  <Checkbox label="Отправить копию" isRadio={true} checked={state.sendMode === 'Send Copy'} onChange={() => dispatch({type: 'SET_SEND_MODE', payload: 'Send Copy'})} />
                  <Checkbox label="Замена текста" isRadio={true} checked={state.sendMode === 'Replacing Text'} onChange={() => dispatch({type: 'SET_SEND_MODE', payload: 'Replacing Text'})} />
                  
                  <div className="mt-1 flex items-center">
                     <Checkbox label="Инфо об источнике*" checked={false} onChange={() => {}} />
                  </div>
              </div>
              
              <div className="relative h-full flex items-end ml-4 pb-2 pr-2">
                  <button 
                      onClick={() => dispatch({type: 'TOGGLE_AUTOPOSTING'})}
                      className={`w-14 h-14 rounded-lg border flex flex-col items-center justify-center hover:brightness-125 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.5)] active:translate-y-[1px] group
                         ${state.isAutoposting 
                            ? 'bg-gradient-to-b from-[#1e3a8a] to-[#172554] border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                            : 'bg-gradient-to-b from-[#2a2a2a] to-[#121212] border-[#333]'}`}
                  >
                      <div className={`w-7 h-7 rounded-full shadow-inner flex items-center justify-center mb-0.5 border
                          ${state.isAutoposting ? 'bg-[#3b82f6] border-[#60a5fa] animate-pulse' : 'bg-[#111] border-[#222] group-hover:bg-[#1a1a1a]'}`}>
                          {state.isAutoposting ? (
                             <Activity size={14} className="text-white" />
                          ) : (
                             <Send size={14} className="text-[#3b82f6] -ml-[1px]" fill="#3b82f6" />
                          )}
                      </div>
                      <span className={`text-[11px] font-bold tracking-wide ${state.isAutoposting ? 'text-white' : 'text-[#e0e0e0]'}`}>
                          {state.isAutoposting ? 'ЗАПУЩЕНО' : 'СТАРТ'}
                      </span>
                  </button>
              </div>
          </div>

      </div>

      {/* SYSTEM STATUS BAR */}
      <div className="h-[22px] shrink-0 bg-[#121212] border-t border-[#2a2a2a] flex items-center px-4 justify-between font-mono text-[10px] text-[#888]">
          <div className="flex items-center gap-4">
              <span className={`flex items-center gap-1.5 font-bold ${state.isAutoposting ? 'text-[#34d399]' : 'text-[#3b82f6]'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full shadow-[0_0_5px_rgba(59,130,246,0.8)] ${state.isAutoposting ? 'bg-[#34d399]' : 'bg-[#3b82f6]'}`}/> 
                  СЕРВЕР &rarr; 7235
              </span>
              <span>Вы администратор в чате: -1001992937282</span>
          </div>
          <div className="flex items-center gap-6">
              {state.isAutoposting && <span className="text-[#34d399] tracking-widest animate-pulse">● МАРШРУТИЗАЦИЯ АКТИВНА</span>}
              <span className="text-[#666]">вер. 5.5.12.14</span>
              <span>Подключено</span>
          </div>
      </div>

      {/* ROUTE SETTINGS MODAL */}
      {state.settingsOpenForRoute && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-50">
              <div className="bg-[#1a1a1a] border border-[#333] shadow-2xl rounded p-0 w-[550px] flex flex-col font-sans max-h-[85vh]">
                  <div className="flex items-center justify-between border-b border-[#2a2a2a] p-4 pb-3">
                      <h3 className="text-white text-sm font-bold flex items-center gap-2">
                         <Settings size={16} className="text-[#888]" />
                         Расширенные настройки маршрута
                      </h3>
                      <button onClick={() => dispatch({type: 'OPEN_ROUTE_SETTINGS', payload: null})} className="text-[#888] hover:text-white transition-colors">
                          <X size={18} />
                      </button>
                  </div>
                  
                  <div className="flex border-b border-[#2a2a2a] text-[11px] font-bold">
                      {(['general', 'replace', 'ai', 'processing'] as const).map(tab => (
                          <button 
                              key={tab}
                              className={`px-4 py-2 uppercase tracking-wide border-b-2 transition-colors ${configTab === tab ? 'border-[#3b82f6] text-[#60a5fa] bg-[#3b82f6]/5' : 'border-transparent text-[#888] hover:text-[#ccc] hover:bg-[#222]'}`}
                              onClick={() => setConfigTab(tab)}
                          >
                              {tab === 'general' ? 'Базовые' : tab === 'replace' ? 'Замена' : tab === 'ai' ? 'Нейросети' : 'Фильтры'}
                          </button>
                      ))}
                  </div>

                  <div className="p-4 overflow-y-auto text-[12px] text-[#ccc] space-y-4" style={{ WebkitOverflowScrolling: 'touch' }}>
                      {configTab === 'general' && (
                          <div className="space-y-3">
                              <div className="bg-[#111] p-3 rounded border border-[#222]">
                                  <Checkbox label="Включить водяные знаки" checked={state.routeConfig.watermark} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {watermark: !state.routeConfig.watermark}})} />
                              </div>
                              <div className="bg-[#111] p-3 rounded border border-[#222]">
                                  <Checkbox label="Повысить приоритет в очереди" checked={state.routeConfig.priority} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {priority: !state.routeConfig.priority}})} />
                              </div>
                              <div className="bg-[#111] p-3 rounded border border-[#222]">
                                  <Checkbox label="Удалять исходные сообщения со ссылками" checked={state.routeConfig.deleteWithLinks} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {deleteWithLinks: !state.routeConfig.deleteWithLinks}})} />
                              </div>
                          </div>
                      )}

                      {configTab === 'replace' && (
                          <div className="space-y-4">
                              <div className="bg-[#111] p-3 rounded border border-[#222] space-y-3">
                                  <div className="flex items-center justify-between">
                                      <Checkbox label="Заменять чужие ссылки на мои" checked={state.routeConfig.replaceLinks} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {replaceLinks: !state.routeConfig.replaceLinks}})} />
                                      <button className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors" title="Настройки ссылок" onClick={() => toggleOption('replaceLinks')}>
                                          <Settings size={14} />
                                      </button>
                                  </div>
                                  {(state.routeConfig.replaceLinks || expandedOptions['replaceLinks']) && (
                                      <input type="text" value={state.routeConfig.myLink} onChange={e => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {myLink: e.target.value}})} className="w-full bg-[#181818] border border-[#333] rounded px-2 py-1.5 text-white outline-none focus:border-[#3b82f6] text-[11px]" placeholder="https://t.me/my_channel" />
                                  )}
                              </div>
                              <div className="bg-[#111] p-3 rounded border border-[#222] space-y-3">
                                  <div className="flex items-center justify-between">
                                      <Checkbox label="Заменять Email на мой" checked={state.routeConfig.replaceEmail} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {replaceEmail: !state.routeConfig.replaceEmail}})} />
                                      <button className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors" title="Настройки Email" onClick={() => toggleOption('replaceEmail')}>
                                          <Settings size={14} />
                                      </button>
                                  </div>
                                  {(state.routeConfig.replaceEmail || expandedOptions['replaceEmail']) && (
                                      <input type="email" value={state.routeConfig.myEmail} onChange={e => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {myEmail: e.target.value}})} className="w-full bg-[#181818] border border-[#333] rounded px-2 py-1.5 text-white outline-none focus:border-[#3b82f6] text-[11px]" placeholder="contact@example.com" />
                                  )}
                              </div>
                              <div className="bg-[#111] p-3 rounded border border-[#222] space-y-3">
                                  <div className="flex items-center justify-between">
                                      <Checkbox label="Заменять номера телефонов на мой" checked={state.routeConfig.replacePhone} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {replacePhone: !state.routeConfig.replacePhone}})} />
                                      <button className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors" title="Настройки телефона" onClick={() => toggleOption('replacePhone')}>
                                          <Settings size={14} />
                                      </button>
                                  </div>
                                  {(state.routeConfig.replacePhone || expandedOptions['replacePhone']) && (
                                      <input type="tel" value={state.routeConfig.myPhone} onChange={e => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {myPhone: e.target.value}})} className="w-full bg-[#181818] border border-[#333] rounded px-2 py-1.5 text-white outline-none focus:border-[#3b82f6] text-[11px]" placeholder="+7 999 000-00-00" />
                                  )}
                              </div>
                          </div>
                      )}

                      {configTab === 'ai' && (
                          <div className="space-y-4">
                              <div className="bg-[#19191c] p-3 rounded border border-[#3b82f6]/30 space-y-3 relative overflow-hidden">
                                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#3b82f6]/10 blur-xl rounded-full"></div>
                                  <div className="flex items-center justify-between">
                                      <Checkbox label="Генерация фото через ИИ (замена оригинала)" checked={state.routeConfig.aiPhotoGeneration} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {aiPhotoGeneration: !state.routeConfig.aiPhotoGeneration}})} />
                                      <button className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors" title="Настройки ИИ для фото" onClick={() => toggleOption('aiPhotoGeneration')}>
                                          <Settings size={14} />
                                      </button>
                                  </div>
                                  {(state.routeConfig.aiPhotoGeneration || expandedOptions['aiPhotoGeneration']) && (
                                      <div className="space-y-3 pt-2 relative z-10">
                                          <div className="flex flex-col gap-1">
                                              <span className="text-[#888] text-[10px]">Модель ИИ</span>
                                              <select value={state.routeConfig.aiPhotoModel} onChange={e => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {aiPhotoModel: e.target.value}})} className="w-full bg-[#181818] border border-[#333] rounded px-2 py-1.5 text-white outline-none focus:border-[#3b82f6] text-[11px]">
                                                  <option value="dall-e-3">DALL-E 3 (OpenAI)</option>
                                                  <option value="midjourney">Midjourney v6</option>
                                                  <option value="stable-diffusion">Stable Diffusion XL</option>
                                              </select>
                                          </div>
                                          <div className="flex flex-col gap-1">
                                              <span className="text-[#888] text-[10px]">Промпт для генерации</span>
                                              <textarea value={state.routeConfig.aiPhotoPrompt} onChange={e => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {aiPhotoPrompt: e.target.value}})} rows={2} className="w-full bg-[#181818] border border-[#333] rounded px-2 py-1.5 text-white outline-none focus:border-[#3b82f6] text-[11px] resize-none" placeholder="Стиль: киберпанк, высокое разрешение..." />
                                          </div>
                                      </div>
                                  )}
                              </div>

                              <div className="bg-[#111] p-3 rounded border border-[#222] space-y-3">
                                  <div className="flex items-center justify-between">
                                      <Checkbox label="Перевод текста через ИИ" checked={state.routeConfig.translateAi} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {translateAi: !state.routeConfig.translateAi}})} />
                                      <button className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors" title="Доп. настройки" onClick={() => toggleOption('translateAi')}>
                                          <Settings size={14} />
                                      </button>
                                  </div>
                                  {(state.routeConfig.translateAi || expandedOptions['translateAi']) && (
                                      <select value={state.routeConfig.translateLanguage} onChange={e => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {translateLanguage: e.target.value}})} className="w-full bg-[#181818] border border-[#333] rounded px-2 py-1.5 text-white outline-none focus:border-[#3b82f6] text-[11px]">
                                          <option value="English">Английский</option>
                                          <option value="Spanish">Испанский</option>
                                          <option value="German">Немецкий</option>
                                          <option value="French">Французский</option>
                                          <option value="Chinese">Китайский</option>
                                          <option value="Arabic">Арабский</option>
                                          <option value="Russian">Русский</option>
                                      </select>
                                  )}
                              </div>

                              <div className="bg-[#111] p-3 rounded border border-[#222] space-y-3">
                                  <div className="flex items-center justify-between">
                                      <Checkbox label="Анонимизировать/уникализировать текст" checked={state.routeConfig.anonymizeText} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {anonymizeText: !state.routeConfig.anonymizeText}})} />
                                      <button className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors" title="Настройки уникализации" onClick={() => toggleOption('anonymizeText')}>
                                          <Settings size={14} />
                                      </button>
                                  </div>
                                  {(state.routeConfig.anonymizeText || expandedOptions['anonymizeText']) && (
                                      <div className="flex flex-col gap-2 pt-1">
                                          <span className="text-[#888] text-[10px] flex justify-between">
                                              <span>Степень уникализации:</span>
                                              <span className="text-[#3b82f6] font-bold">{state.routeConfig.anonymizePercent}%</span>
                                          </span>
                                          <input type="range" min="10" max="100" step="5" value={state.routeConfig.anonymizePercent} onChange={e => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {anonymizePercent: parseInt(e.target.value)}})} className="w-full cursor-pointer accent-[#3b82f6]" />
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      {configTab === 'processing' && (
                          <div className="space-y-4">
                              <div className="bg-[#111] p-3 rounded border border-[#222] space-y-3">
                                  <Checkbox label="Не публиковать рекламные посты (AI-детектор)" checked={state.routeConfig.skipAds} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {skipAds: !state.routeConfig.skipAds}})} />
                              </div>
                              <div className="bg-[#111] p-3 rounded border border-[#222] space-y-3">
                                  <div className="flex items-center justify-between">
                                      <Checkbox label="Стоп-слова (удалять посты)" checked={state.routeConfig.stopWordsEnabled} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {stopWordsEnabled: !state.routeConfig.stopWordsEnabled}})} />
                                      <button className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors" title="Настройки" onClick={() => toggleOption('stopWordsEnabled')}>
                                          <Settings size={14} />
                                      </button>
                                  </div>
                                  {(state.routeConfig.stopWordsEnabled || expandedOptions['stopWordsEnabled']) && (
                                      <textarea value={state.routeConfig.stopWordsList} onChange={e => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {stopWordsList: e.target.value}})} rows={2} className="w-full bg-[#181818] border border-[#333] rounded px-2 py-1.5 text-white outline-none focus:border-[#3b82f6] text-[11px] resize-none" placeholder="казино, ставки, 18+" />
                                  )}
                              </div>
                              <div className="bg-[#111] p-3 rounded border border-[#222] space-y-3">
                                  <div className="flex items-center justify-between">
                                      <Checkbox label="Добавлять свой текст/ссылки в конец поста" checked={state.routeConfig.appendTextEnabled} onChange={() => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {appendTextEnabled: !state.routeConfig.appendTextEnabled}})} />
                                      <button className="text-[#3b82f6] hover:text-[#60a5fa] transition-colors" title="Настройки добавления" onClick={() => toggleOption('appendTextEnabled')}>
                                          <Settings size={14} />
                                      </button>
                                  </div>
                                  {(state.routeConfig.appendTextEnabled || expandedOptions['appendTextEnabled']) && (
                                      <textarea value={state.routeConfig.appendTextContent} onChange={e => dispatch({type: 'UPDATE_ROUTE_CONFIG', payload: {appendTextContent: e.target.value}})} rows={3} className="w-full bg-[#181818] border border-[#333] rounded px-2 py-1.5 text-white outline-none focus:border-[#3b82f6] text-[11px] resize-none" placeholder="Подписывайтесь на наш канал: https://t.me/mychannel" />
                                  )}
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-4 border-t border-[#2a2a2a] flex justify-end bg-[#151515] rounded-b">
                     <button 
                        className="bg-[#3b82f6] hover:bg-[#2563eb] transition-colors text-white px-6 py-2 rounded text-[12px] font-bold shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                        onClick={() => dispatch({type: 'OPEN_ROUTE_SETTINGS', payload: null})}
                     >
                        Сохранить настройки
                     </button>
                  </div>
              </div>
          </div>
      )}

      {/* CONTEXT MENU OVERLAY */}
      {state.contextMenu && (
          <div 
              className="fixed inset-0 z-50 overflow-hidden" 
              onContextMenu={e => e.preventDefault()} 
              onClick={() => dispatch({type: 'CLOSE_MENU'})}
          >
              <div 
                  className="absolute bg-[#1a1a1a] border border-[#333] shadow-2xl rounded-[2px] py-1 min-w-[220px] text-[#ccc] text-[11px] font-sans"
                  style={{ top: Math.min(state.contextMenu.y, window.innerHeight - 200), left: Math.min(state.contextMenu.x, window.innerWidth - 220) }}
                  onClick={e => e.stopPropagation()}
              >
                  {state.contextMenu.type === 'sources' && (
                      <>
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer flex justify-between" onClick={() => { dispatch({type: 'SELECT_ALL_SOURCES', payload: filteredSources.map(s => s.id)}); dispatch({type: 'CLOSE_MENU'}); }}><span>Выбрать все</span><span className="text-[#666]">Ctrl+A</span></div>
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer flex justify-between" onClick={() => { dispatch({type: 'INVERT_SOURCES', payload: filteredSources.map(s => s.id)}); dispatch({type: 'CLOSE_MENU'}); }}><span>Инвертировать</span><span className="text-[#666]">Ctrl+I</span></div>
                         <div className="h-[1px] bg-[#333] my-1" />
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer text-[#888] relative group">
                             <span className="flex justify-between"><span>Снять выделение для</span><span>▶</span></span>
                             <div className="hidden group-hover:block absolute left-full top-[-4px] bg-[#1a1a1a] border border-[#333] py-1 w-[150px] shadow-xl">
                                 <div className="px-3 py-1 hover:bg-[#2a4570] text-[#ccc]" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Групп</div>
                                 <div className="px-3 py-1 hover:bg-[#2a4570] text-[#ccc]" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Каналов</div>
                                 <div className="px-3 py-1 hover:bg-[#2a4570] text-[#ccc]" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Ботов</div>
                                 <div className="px-3 py-1 hover:bg-[#2a4570] text-[#ccc]" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Контактов</div>
                             </div>
                         </div>
                         <div className="h-[1px] bg-[#333] my-1" />
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Изменить</div>
                         <div className="px-3 py-1 hover:bg-[#ef4444] hover:text-white cursor-pointer text-[#ef4444]" onClick={() => { dispatch({type: 'DELETE_SELECTED_SOURCES'}); dispatch({type: 'CLOSE_MENU'}); }}>Удалить выбранное</div>
                      </>
                  )}
                  {state.contextMenu.type === 'targets' && (
                      <>
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Быстрый поиск чата</div>
                         <div className="h-[1px] bg-[#333] my-1" />
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer flex justify-between" onClick={() => { dispatch({type: 'SELECT_ALL_TARGETS', payload: filteredTargets.map(t => t.id)}); dispatch({type: 'CLOSE_MENU'}); }}><span>Выбрать все</span><span className="text-[#666]">Ctrl+A</span></div>
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer flex justify-between" onClick={() => { dispatch({type: 'INVERT_TARGETS', payload: filteredTargets.map(t => t.id)}); dispatch({type: 'CLOSE_MENU'}); }}><span>Инвертировать</span><span className="text-[#666]">Ctrl+I</span></div>
                      </>
                  )}
                  {state.contextMenu.type === 'routes' && (
                      <>
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Открыть / Сохранить сессию</div>
                         <div className="h-[1px] bg-[#333] my-1" />
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Изменить маршрут</div>
                         <div className="px-3 py-1 hover:bg-[#ef4444] hover:text-white cursor-pointer text-[#ef4444]" onClick={() => { dispatch({type: 'DELETE_SELECTED_ROUTES'}); dispatch({type: 'CLOSE_MENU'}); }}>Удалить выбранное</div>
                         <div className="h-[1px] bg-[#333] my-1" />
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer" onClick={() => { dispatch({type: 'SELECT_ALL_ROUTES'}); dispatch({type: 'CLOSE_MENU'}); }}>Отметить все</div>
                      </>
                  )}
                  {state.contextMenu.type === 'replace' && (
                      <>
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Перевод всех сообщений на:</div>
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer text-[#999]" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Оригинальное сообщение должно содержать только слова из списка...</div>
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Добавить текст в конец сообщения</div>
                         <div className="h-[1px] bg-[#333] my-1" />
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer flex justify-between" onClick={() => dispatch({type: 'CLOSE_MENU'})}><span>Общая замена. Регулярные выражения</span><span className="text-[#666]">Win+G</span></div>
                         <div className="h-[1px] bg-[#333] my-1" />
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer text-[#999]" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Все в верхнем регистре</div>
                         <div className="px-3 py-1 hover:bg-[#2a4570] cursor-pointer text-[#999]" onClick={() => dispatch({type: 'CLOSE_MENU'})}>Все в нижнем регистре. Нормальное выполнение.</div>
                      </>
                  )}
              </div>
          </div>
      )}

    </div>
  );
};

