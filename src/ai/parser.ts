import { ollamaGenerate } from './ollama.js';

export interface ParsedProduct {
  product?: string;
  price?: string;
  seller?: string;
  contact?: string;
  isRelevant: boolean;
}

export async function parseCompetitorMessage(text: string): Promise<ParsedProduct | null> {
  const prompt = `
Ты извлекаешь данные из объявлений.

Правила:
- Только реальные продажи
- Игнорируй флуд, чат, вопросы
- Цена должна быть числом или с валютой

Примеры:

"Продам iPhone 13 128GB, 500$"
→ { "isRelevant": true, "product": "iPhone 13 128GB", "price": "500$", "seller": null }

"Кто знает где купить?"
→ { "isRelevant": false }

Теперь анализируй:

"${text}"
`;

  const res = await ollamaGenerate(prompt);

  try {
    // Убираем возможные markdown-блоки, которые иногда выдает ИИ
    const jsonStr = res.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(jsonStr);

    if (!json.isRelevant) return null;

    return json;
  } catch {
    return null;
  }
}
