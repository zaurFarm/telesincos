import { ollamaGenerate } from './ollama.js';

export interface RiskAnalysis {
  risk: 'low' | 'medium' | 'high';
  flags: string[];
  reason: string;
}

export async function analyzeRisk(message: string): Promise<RiskAnalysis> {
  const prompt = `
Ты анализируешь сообщение пользователя.

Определи:
- есть ли подозрительные признаки (агрессия, токсичность, спам, копипаст, неадекватные требования, попытки выманить инфу)
- уровень риска (low - нормальный клиент, medium - странный, high - спам/агрессия/мошенник)

Ответ строго JSON:
{
  "risk": "low" | "medium" | "high",
  "flags": ["..."],
  "reason": "..."
}

Сообщение:
"${message}"
`;

  try {
    const res = await ollamaGenerate(prompt);
    const match = res.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (['low', 'medium', 'high'].includes(parsed.risk)) {
        return parsed as RiskAnalysis;
      }
    }
  } catch (e) {
    console.error("Failed to analyze risk", e);
  }

  return { risk: 'low', flags: [], reason: 'default' };
}
