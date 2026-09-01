import OpenAI from 'openai';

type Target = { name: string; apiKey: string; baseURL?: string; model: string };

/** Ошибки, при которых имеет смысл пробовать следующего провайдера */
function shouldFallback(err: any): boolean {
  const status = Number(err?.status ?? err?.response?.status ?? 0);
  const code = String(err?.code || err?.error?.code || '');
  const msg = String(err?.message || '');
  if ([401, 402, 403, 408, 409, 429].includes(status) || status >= 500) return true;
  return /insufficient_quota|credit_balance_exhausted|rate_limit|ECONNRESET|ETIMEDOUT|ENOTFOUND|fetch failed|timeout/i.test(code + ' ' + msg);
}

export async function chatWithFallback(params: {
  settings: any; prompt: string; systemPrompt?: string; model?: string; temperature?: number; json?: boolean;
}): Promise<string> {
  const { settings, prompt, systemPrompt, temperature = 0.7, json = false } = params;

  const targets: Target[] = [];
  const openaiKey = settings?.openAiKey || process.env.OPENAI_API_KEY;
  if (openaiKey) targets.push({ name: 'openai', apiKey: openaiKey, model: params.model || settings?.openAiModel || 'gpt-4o-mini' });
  if (process.env.GROQ_API_KEY) targets.push({
    name: 'groq', apiKey: process.env.GROQ_API_KEY,
    baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  });
  if ((process.env.AI_PRIMARY || '').toLowerCase() === 'groq' && targets.length === 2) targets.reverse();
  if (targets.length === 0) throw new Error('No AI provider configured (OPENAI_API_KEY / GROQ_API_KEY)');

  const messages: any[] = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push({ role: 'user', content: json ? prompt + '\n\nОтветь строго валидным JSON.' : prompt });

  let lastErr: any = null;
  for (const t of targets) {
    try {
      const client = new OpenAI({ apiKey: t.apiKey, baseURL: t.baseURL, timeout: 45_000, maxRetries: 1 });
      const res = await client.chat.completions.create({
        model: t.model, messages, temperature,
        ...(json ? { response_format: { type: 'json_object' as const } } : {}),
      });
      const text = res.choices?.[0]?.message?.content || '';
      if (t.name !== targets[0].name) console.warn(`[ai] answered via fallback provider: ${t.name} (${t.model})`);
      return text;
    } catch (err: any) {
      lastErr = err;
      console.error(`[ai] provider ${t.name} failed:`, err?.status || '', err?.code || err?.error?.code || '', String(err?.message || '').slice(0, 160));
      if (!shouldFallback(err)) throw err;
    }
  }
  throw lastErr || new Error('all AI providers failed');
}
