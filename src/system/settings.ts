import crypto from 'crypto';
import { getTenantId } from './context.js';

export interface GlobalSettings {
  moderationEnabled: boolean;
  chatEnabled: boolean;
  moderationPrompt: string;
  chatPrompt: string;
  maxVideoSizeMB: number;
  preventDuplicates: boolean;
  duplicateDistance: number;
  externalApiToken: string;
  proxyIp: string;
  proxyPort: string;
  proxyUser: string;
  proxyPass: string;
  aiProvider: 'gemini' | 'openai' | 'ollama';
  useOllama: boolean;
  ollamaEndpoint: string;
  ollamaModel: string;
  openAiKey: string;
  openAiModel: string;
  proactiveSales: boolean;
  adminChatId: number;
  targetForwardGroup: number;
  forwardMode: string;
  autoReplyKeywords: string;
  autoReplyPrompt: string;
  apiId: string;
  apiHash: string;
  phoneNumber: string;
  sessionString: string;
  useUserbot: boolean;
  connectionMode: 'mtproto' | 'botapi' | 'hybrid';
  autoPostEnabled: boolean;
  autoPostIntervalMin: number;
  autoPostRules: string;
  botMode: 'moderator' | 'companion' | 'both' | 'off';
  [key: string]: any;
}

function defaultSettings(): GlobalSettings {
  return {
    moderationEnabled: true,
    chatEnabled: true,
    moderationPrompt: "Проанализируй это сообщение на предмет нарушения Условий использования Telegram или общих правил сообщества.",
    chatPrompt: "Ты полезный, человекоподобный ассистент в Telegram-группе. Отвечай естественно, кратко, без воды и спама. Будь вежлив и не звучи как робот. Отвечай на русском языке.",
    maxVideoSizeMB: 20,
    preventDuplicates: true,
    duplicateDistance: 10,
    externalApiToken: crypto.randomBytes(16).toString('hex'),
    proxyIp: "",
    proxyPort: "",
    proxyUser: "",
    proxyPass: "",
    aiProvider: 'openai',
    useOllama: false,
    ollamaEndpoint: process.env.OLLAMA_URL || "http://localhost:11434",
    ollamaModel: process.env.OLLAMA_MODEL || "llama3",
    openAiKey: process.env.OPENAI_API_KEY || "",
    openAiModel: "gpt-4o-mini",
    proactiveSales: false,
    adminChatId: 0,
    targetForwardGroup: 0,
    forwardMode: 'copy',
    autoReplyKeywords: '',
    autoReplyPrompt: '',
    apiId: '',
    apiHash: '',
    phoneNumber: '',
    sessionString: '',
    useUserbot: false,
    connectionMode: 'hybrid',
    autoPostEnabled: false,
    autoPostIntervalMin: 60,
    autoPostRules: '',
    botMode: 'both'
  };
}

// In-memory кэш настроек по каждому tenant (workspace), чтобы не бить в БД на каждый вызов
const settingsCache = new Map<string, GlobalSettings>();

function resolveTenantId(explicitTenantId?: string): string {
  return explicitTenantId || getTenantId() || 'tenant_1';
}

// Синхронное чтение из кэша (используется в местах, где нет await).
// Если для тенанта ещё ничего не загружено — отдаём дефолт и в фоне подгружаем из БД.
export function getSettings(explicitTenantId?: string): GlobalSettings {
  const tenantId = resolveTenantId(explicitTenantId);
  const cached = settingsCache.get(tenantId);
  if (cached) return cached;

  const fresh = defaultSettings();
  settingsCache.set(tenantId, fresh);
  void loadSettingsForTenant(tenantId);
  return fresh;
}

export function updateSettings(newSettings: Partial<GlobalSettings>, explicitTenantId?: string) {
  const tenantId = resolveTenantId(explicitTenantId);
  const current = settingsCache.get(tenantId) || defaultSettings();

  if (newSettings.useOllama === true) {
    newSettings.aiProvider = 'ollama';
  } else if (newSettings.useOllama === false && current.aiProvider === 'ollama') {
    newSettings.aiProvider = 'openai';
  }

  const updated = { ...current, ...newSettings };
  settingsCache.set(tenantId, updated);
  void persistSettings(tenantId, updated);
}

async function persistSettings(tenantId: string, settings: GlobalSettings): Promise<void> {
  try {
    const { db } = await import('../db.js');
    await db.withTenant(tenantId, (client: any) => client.query(
      `INSERT INTO workspace_settings (workspace_id, settings, updated_at)
       VALUES ($1::uuid, $2::jsonb, NOW())
       ON CONFLICT (workspace_id) DO UPDATE SET settings = $2::jsonb, updated_at = NOW()`,
      [tenantId, JSON.stringify(settings)]
    ));
  } catch (e: any) {
    console.error(`[Settings] Failed to persist settings for tenant ${tenantId}:`, e.message);
  }
}

async function loadSettingsForTenant(tenantId: string): Promise<void> {
  try {
    const { db } = await import('../db.js');
    const res = await db.withTenant(tenantId, (client: any) => client.query(
      'SELECT settings FROM workspace_settings WHERE workspace_id = $1::uuid',
      [tenantId]
    ));
    if (res.rows.length && res.rows[0].settings) {
      const stored = res.rows[0].settings;
      const merged = { ...defaultSettings(), ...stored };
      settingsCache.set(tenantId, merged);
    }
  } catch (e: any) {
    // tenant_1 (legacy) или невалидный UUID тенанта — не критично, остаёмся на дефолтах
    console.debug(`[Settings] No persisted settings for tenant ${tenantId} (${e.message})`);
  }
}

// Предзагрузка настроек площадки при старте процесса (для tenant_1 / legacy-режима)
export async function loadSettings(): Promise<void> {
  await loadSettingsForTenant('tenant_1');
  console.log('[Settings] Per-tenant settings system initialized.');
}
