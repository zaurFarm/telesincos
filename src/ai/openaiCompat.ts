import OpenAI from 'openai';

type Target = { name: string; apiKey: string; baseURL?: string; model: string };

function shouldFallback(err: any): boolean {
  const status = Number(err?.status ?? err?.response?.status ?? 0);
  const code = String(err?.code || err?.error?.code || '');
  const msg = String(err?.message || '');
  if ([401, 402, 403, 408, 409, 429].includes(status) || status >= 500) return true;
  return /insufficient_quota|credit_balance_exhausted|rate_limit|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|timeout/i.test(code + ' ' + msg);
}

/** Groq в 429 пишет "Please try again in 1.425s" — вытаскиваем паузу */
function retryAfterMs(err: any): number | null {
  const m = String(err?.message || '').match(/try again in ([\d.]+)\s*(ms|s)/i);
  if (!m) return null;
  const v = parseFloat(m[1]); const ms = m[2].toLowerCase() === 'ms' ? v : v * 1000;
  return Math.min(Math.ceil(ms) + 300, 8000);
}
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

let callCount = 0, windowStart = Date.now();
const callerStats: Record<string, number> = {};
function callerName(): string {
  const lines = String(new Error().stack || '').split('\n').slice(1);
  for (const l of lines) {
    if (/openaiCompat|provider\.ts|provider\.js|chatWithFallback|generateContent|generateJSON|node_modules|node:internal/.test(l)) continue;
    const m = l.match(/at (?:async )?([\w.$<>]+)/); if (m && m[1] !== 'Object.<anonymous>') return m[1];
    const f = l.match(/([\w-]+\.(?:ts|cjs|js)):(\d+)/); if (f) return f[1] + ':' + f[2];
  }
  return 'unknown';
}

export async function chatWithFallback(params: {
  settings: any; prompt: string; systemPrompt?: string; model?: string; temperature?: number; json?: boolean;
}): Promise<string> {
  const { settings, prompt, systemPrompt, temperature = 0.7, json = false } = params;

  // Учёт частоты вызовов: раз в минуту в лог — сколько запросов к ИИ ушло
  callCount++;
  const who = callerName(); callerStats[who] = (callerStats[who] || 0) + 1;
  if (Date.now() - windowStart > 60_000) {
    console.log(`[ai] calls per minute: ${callCount} ${JSON.stringify(callerStats)}`);
    callCount = 0; windowStart = Date.now(); for (const k in callerStats) delete callerStats[k];
  }

  const targets: Target[] = [];
  const openaiKey = settings?.openAiKey || process.env.OPENAI_API_KEY;
  if (openaiKey) targets.push({ name: 'openai', apiKey: openaiKey, model: params.model || settings?.openAiModel || 'gpt-4o-mini' });
  if (process.env.GROQ_API_KEY) targets.push({
    name: 'groq', apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    // JSON-задачи (анализ, классификация) — на лёгкую модель с отдельной квотой
    model: (json && process.env.GROQ_MODEL_JSON) || process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
  });
  if ((process.env.AI_PRIMARY || '').toLowerCase() === 'groq' && targets.length === 2) targets.reverse();
  if (targets.length === 0) throw new Error('No AI provider configured (OPENAI_API_KEY / GROQ_API_KEY)');

  const messages: any[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: json ? prompt + '\n\nОтветь строго валидным JSON.' : prompt });

  let lastErr: any = null;
  for (const t of targets) {
    const client = new OpenAI({ apiKey: t.apiKey, baseURL: t.baseURL, timeout: 45_000, maxRetries: 0 });
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await client.chat.completions.create({
          model: t.model, messages, temperature,
          ...(json ? { response_format: { type: 'json_object' as const } } : {}),
        });
        const text = res.choices?.[0]?.message?.content || '';
        if (t.name !== targets[0].name) console.warn(`[ai] answered via fallback provider: ${t.name} (${t.model})`);
        return text;
      } catch (err: any) {
        lastErr = err;
        const wait = retryAfterMs(err);
        if (Number(err?.status) === 429 && wait && attempt < 3) {
          console.warn(`[ai] ${t.name} rate-limited, retry ${attempt} after ${wait}ms`);
          await sleep(wait); continue;
        }
        console.error(`[ai] provider ${t.name} failed:`, err?.status || '', err?.code || err?.error?.code || '', String(err?.message || '').slice(0, 140));
        if (!shouldFallback(err)) throw err;
        break; // к следующему провайдеру
      }
    }
  }
  throw lastErr || new Error('all AI providers failed');
}
