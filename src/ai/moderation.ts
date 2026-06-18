import { ollamaGenerate } from './ollama.js';

export async function moderateMessage(text: string): Promise<{
  shouldDelete: boolean;
  reason?: string;
}> {
  const prompt = `
Ты модератор Telegram.

Определи, нужно ли удалить сообщение.

Правила:
- Спам
- Реклама
- Ссылки
- Оскорбления
- Дубликаты

Ответ строго в JSON:

{
  "delete": true/false,
  "reason": "причина"
}

Сообщение:
"${text}"
`;

  const response = await ollamaGenerate(prompt);

  try {
    // Attempt to extract JSON if the model outputs markdown blocks
    const jsonStr = response.replace(/```json/g, '').replace(/```/g, '').trim();
    const json = JSON.parse(jsonStr);
    return {
      shouldDelete: json.delete,
      reason: json.reason
    };
  } catch {
    return { shouldDelete: false };
  }
}
