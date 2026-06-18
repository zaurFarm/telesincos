import crypto from 'crypto';

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
  [key: string]: any;
}

let botSettings: GlobalSettings = {
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
  autoPostRules: ''
};

export function getSettings(): GlobalSettings {
  return botSettings;
}

export function updateSettings(newSettings: Partial<GlobalSettings>) {
  // Translate legacy useOllama into aiProvider if needed
  if (newSettings.useOllama === true) {
    newSettings.aiProvider = 'ollama';
  } else if (newSettings.useOllama === false && botSettings.aiProvider === 'ollama') {
    newSettings.aiProvider = 'openai';
  }
  
  botSettings = { ...botSettings, ...newSettings };
}
