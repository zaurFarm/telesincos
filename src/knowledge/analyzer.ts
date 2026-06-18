import dotenv from 'dotenv';
dotenv.config();

export async function analyzeText(text: string) {
  const prompt = `
  Проанализируй текст и выдели:
  1. Причины блокировок
  2. Ограничения платформы Telegram/соцсетей
  3. Рекомендации по безопасному использованию (антибан)

  Ответ СТРОГО в валидном JSON формате, без markdown разметки:
  {
    "risks": ["риск 1", "риск 2"],
    "limits": ["лимит 1", "лимит 2"],
    "recommendations": ["рек 1", "рек 2"]
  }

  Текст:
  ${text}
  `;

  try {
    const { generateJSON } = await import('../ai/provider.js');
    return await generateJSON(prompt);
  } catch (e) {
    console.error("Knowledge analyzer error:", e);
    return { risks: [], limits: [], recommendations: [] };
  }
}
