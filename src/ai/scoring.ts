import { ollamaGenerate } from './ollama.js';

export interface LeadScore {
  isLead: boolean;
  intent: 'buy' | 'question' | 'other';
  temperature: 'hot' | 'warm' | 'cold';
  product?: string;
  budget?: string;
  confidence: number;
}

export async function scoreMessage(text: string): Promise<LeadScore | null> {
  const prompt = `
Ты анализируешь сообщения и находишь клиентов.

Определи:
- это потенциальный клиент или нет
- намерение (buy / question / other)
- температура лида (hot / warm / cold)
- товар
- бюджет (если есть)

Ответ строго JSON:

{
  "isLead": true/false,
  "intent": "buy",
  "temperature": "hot",
  "product": "что ищет",
  "budget": "бюджет",
  "confidence": 0.0-1.0
}

Сообщение:
"${text}"
`;

  const res = await ollamaGenerate(prompt);

  try {
    const jsonStr = res.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}
