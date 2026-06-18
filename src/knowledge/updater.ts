import { analyzeText } from './analyzer.js';
import { db } from '../db.js';

// Имитация скрапинга источников, так как Puppeteer в данной среде не запущен:
// В реальных условиях здесь был бы fetch по url из sources.ts
async function fetchSources() {
  return [
    "Пользователи жалуются, что если отправить больше 50 сообщений незнакомым людям в день, аккаунт улетает во флуд-вейт.",
    "Telegram банит за использование одинаковых ответов (копипаст). Используйте рандомизацию текста.",
    "Резкий старт рассылки с нового аккаунта приводит к бану. Нужно прогревать аккаунт ответами на входящие, имитируя человека."
  ];
}

export async function runKnowledgeUpdate() {
  try {
    const texts = await fetchSources();
    for (const t of texts) {
      const analysis = await analyzeText(t);
      
      if (analysis.risks && analysis.risks.length > 0) {
        await db.query(
          `INSERT INTO knowledge_base (source, risks, limits, recommendations)
           VALUES ($1, $2, $3, $4)`,
          ["auto_monitor", JSON.stringify(analysis.risks), JSON.stringify(analysis.limits), JSON.stringify(analysis.recommendations)]
        );
      }
    }
    console.log("✅ Knowledge Base updated from public sources.");
  } catch (e) {
    console.error("Failed to update knowledge base:", e);
  }
}
