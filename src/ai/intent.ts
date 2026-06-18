import { ollamaGenerate } from './ollama.js';

export interface BuyingStage {
  stage: 'interest' | 'consideration' | 'ready' | 'objection';
  confidence: number;
  product?: string;
}

export async function detectBuyingStage(message: string): Promise<BuyingStage> {
  const prompt = `
Определи стадию клиента и товар, который он хочет:

1. interest (интересуется)
2. consideration (сравнивает)
3. ready (готов купить)
4. objection (сомневается)

Сообщение:
"${message}"

Ответ строго JSON:
{ "stage": "...", "confidence": 0.0-1.0, "product": "упомянутый товар или null" }
`;

  try {
    const res = await ollamaGenerate(prompt);
    
    // Попытка извлечь JSON
    const match = res.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      if (['interest', 'consideration', 'ready', 'objection'].includes(parsed.stage)) {
        return parsed as BuyingStage;
      }
    }
  } catch (e) {
    console.error("Failed to detect buying stage", e);
  }

  return { stage: 'interest', confidence: 0.5 };
}
