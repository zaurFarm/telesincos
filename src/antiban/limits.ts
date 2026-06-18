import { db } from '../db.js';

let BASE_DAILY_LIMIT = 40;
let dynamicLimit = BASE_DAILY_LIMIT;

// Периодически пересчитываем лимиты на основе базы знаний
export async function calculateDynamicLimit() {
  try {
    const res = await db.query(`
      SELECT risks, recommendations FROM knowledge_base 
      ORDER BY created_at DESC LIMIT 10
    `);
    
    let isHighRiskPeriod = false;
    
    // Простой анализ: если в свежих знаниях часто упоминаются баны за новые правила, затягиваем пояса
    res.rows.forEach(row => {
      const risks = JSON.stringify(row.risks || []).toLowerCase();
      if (risks.includes("баны") || risks.includes("флуд-вейт") || risks.includes("пользователи жалуются")) {
        isHighRiskPeriod = true;
      }
    });

    if (isHighRiskPeriod) {
      dynamicLimit = Math.floor(BASE_DAILY_LIMIT * 0.6); // Режем лимит на 40% во время "шторма" блокировок
      console.log(`[ANTIBAN] Обстановка напряженная. Установлен динамический лимит: ${dynamicLimit}`);
    } else {
      dynamicLimit = BASE_DAILY_LIMIT;
    }
  } catch (e) {
    // silently fail
  }
}

// Пересчитываем раз в час
setInterval(calculateDynamicLimit, 60 * 60 * 1000);

export async function canSendMessage(): Promise<boolean> {
  try {
    const res = await db.query(`
      SELECT COUNT(*) FROM actions 
      WHERE type IN ('reply', 'lead_reply', 'retarget', 'upsell')
      AND created_at > NOW() - INTERVAL '1 hour'
    `);
    const hourlyCount = Number(res.rows[0].count);
    return hourlyCount < dynamicLimit;
  } catch (e) {
    console.error("Failed to check limits", e);
    return false; // Safest default
  }
}

export function incrementMessageCount() {
  // Now handled implicitly by DB logging via logAction / actions table
}
