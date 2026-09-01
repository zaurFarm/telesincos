import { GoogleGenAI } from '@google/genai';
import { getSettings } from '../system/settings.js';
import OpenAI from 'openai';
import { chatWithFallback } from './openaiCompat.js';

interface GenerateOptions {
  model?: string;
  temperature?: number;
  systemPrompt?: string;
  tenantId?: string;
}

export async function generateContent(prompt: string, opts?: GenerateOptions): Promise<string> {
  const settings = getSettings();
  const provider = settings.aiProvider || 'openai';
  const tenantId = opts?.tenantId || 'tenant_1';

  try {
    // 1. Check & Reserve usage
    const { billing } = await import('../system/billing.js');
    let usageId: string | null = null;
    try {
       usageId = await billing.reserve(tenantId, 'ai_calls', 1);
    } catch (limitErr: any) {
       console.error(`Billing limit hit for tenant ${tenantId}:`, limitErr.message);
       throw limitErr; // Escalate out
    }

    try {
      if (provider === 'openai') {
          const text = await chatWithFallback({ settings, prompt, systemPrompt: opts?.systemPrompt, model: opts?.model, temperature: opts?.temperature ?? 0.7 });
          if (usageId) await billing.confirm(tenantId, usageId);
          return text;

      } else if (provider === 'ollama') {
        const endpoint = settings.ollamaEndpoint || process.env.OLLAMA_URL || 'http://localhost:11434';
        const model = opts?.model || settings.ollamaModel || process.env.OLLAMA_MODEL || 'llama3';
        
        let finalPrompt = prompt;
        if (opts?.systemPrompt) {
          finalPrompt = opts.systemPrompt + "\n\n" + prompt;
        }

        const res = await fetch(`${endpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            prompt: finalPrompt,
            stream: false,
            options: {
              temperature: opts?.temperature ?? 0.7
            }
          })
        });

        const data = await res.json();
        
        // 2. Confirm usage on success
        if (usageId) await billing.confirm(tenantId, usageId);
        
        return data.response?.trim() || '';

      } else {
        // Gemini
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const model = opts?.model || 'gemini-2.5-flash';
        let finalPrompt = prompt;
        if (opts?.systemPrompt) {
          finalPrompt = opts.systemPrompt + "\n\n" + prompt;
        }

        let attempt = 0;
        let responseStr = '';
        while (attempt < 2) {
          attempt++;
          try {
            const timeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('TimeoutError')), 7000);
            });
            
            const response = await Promise.race([
               ai.models.generateContent({
                 model,
                 contents: finalPrompt,
                 config: {
                   temperature: opts?.temperature ?? 0.7
                 }
               }),
               timeoutPromise
            ]);
    
            responseStr = response.text || '';
            break; // Success, break retry loop
          } catch (err: any) {
            if (err.message === 'TimeoutError') {
               console.warn(`Gemini API timeout. Attempt ${attempt}`);
               if (attempt >= 2) throw err;
            } else {
               throw err;
            }
          }
        }
        
        // 2. Confirm usage on success
        if (usageId) await billing.confirm(tenantId, usageId);
        
        return responseStr;
      }
    } catch (execErr) {
       // 3. Revert usage on failure
       if (usageId) await billing.revert(tenantId, usageId);
       throw execErr;
    }
  } catch (error) {
    console.error(`Error generating content with provider ${provider}:`, error);
    return '';
  }
}

export async function generateJSON(prompt: string, opts?: GenerateOptions): Promise<any> {
    const settings = getSettings();
    const provider = settings.aiProvider || 'openai';

  try {
    // 1. Check & Reserve usage
    const { billing } = await import('../system/billing.js');
    const tenantId = opts?.tenantId || 'tenant_1';
    let usageId: string | null = null;
    try {
       usageId = await billing.reserve(tenantId, 'ai_calls', 1);
    } catch (limitErr: any) {
       console.error(`Billing limit hit for tenant ${tenantId}:`, limitErr.message);
       throw limitErr; // Escalate out
    }

    try {
        if (provider === 'openai') {
          const text = await chatWithFallback({ settings, prompt, systemPrompt: opts?.systemPrompt, model: opts?.model, temperature: opts?.temperature ?? 0.7, json: true });
          if (usageId) await billing.confirm(tenantId, usageId);
          return JSON.parse(text || '{}');
    
        } else if (provider === 'ollama') {
            const endpoint = settings.ollamaEndpoint || process.env.OLLAMA_URL || 'http://localhost:11434';
            const model = opts?.model || settings.ollamaModel || process.env.OLLAMA_MODEL || 'llama3';
            
            let finalPrompt = prompt;
            if (opts?.systemPrompt) {
                finalPrompt = opts.systemPrompt + "\n\n" + prompt;
            }

            const res = await fetch(`${endpoint}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                model,
                prompt: finalPrompt,
                stream: false,
                format: "json",
                options: {
                    temperature: opts?.temperature ?? 0.7
                }
                })
            });

            const data = await res.json();
            if (usageId) await billing.confirm(tenantId, usageId);
            return JSON.parse(data.response?.trim() || '{}');
        } else {
            // Gemini
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const model = opts?.model || 'gemini-2.5-flash';
            let finalPrompt = prompt;
            if (opts?.systemPrompt) {
                finalPrompt = opts.systemPrompt + "\n\n" + prompt;
            }

            const response = await ai.models.generateContent({
                model,
                contents: finalPrompt,
                config: {
                    responseMimeType: "application/json",
                    temperature: opts?.temperature ?? 0.7
                }
            });

            if (usageId) await billing.confirm(tenantId, usageId);
            return JSON.parse(response.text || '{}');
        }
    } catch (execErr) {
       if (usageId) await billing.revert(tenantId, usageId);
       throw execErr;
    }
  } catch (e: any) {
    console.error("AI JSON gen failed via provider:", provider, e);
    return {};
  }
}
