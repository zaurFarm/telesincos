import { db as pool } from "../db.js";

export async function generateInsights() {
  const insights: string[] = [];

  try {
    // 1. Конверсия
    const conv = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status='closed')::float /
        NULLIF(COUNT(*),0) as conversion
      FROM leads
      WHERE created_at > NOW() - INTERVAL '7 days'
    `);

    const conversion = conv.rows[0]?.conversion || 0;

    if (conversion < 0.1 && conversion > 0) {
      insights.push("Низкая конверсия (< 10%) — попробуй изменить первый ответ (отправь оффер мягче).");
    } else if (conversion === 0) {
       insights.push("Пока нет успешных оплат за последнюю неделю. Пересмотри скрипт продаж.");
    }

    // 2. Диалог застрял
    const stuck = await pool.query(`
      SELECT COUNT(*) FROM leads 
      WHERE status='dialog' OR status='contacted'
    `);

    const stuckCount = Number(stuck.rows[0]?.count || 0);
    if (stuckCount > 5) {
      insights.push(`Довольно много диалогов зависло (более ${stuckCount}). Стоит запустить бота на Push (фоллоу-апы).`);
    }

    // 3. Риск
    const risk = await pool.query(`
      SELECT COUNT(*) FROM farm_accounts WHERE status='risk'
    `);

    const riskCount = Number(risk.rows[0]?.count || 0);
    if (riskCount > 0) {
      insights.push(`Есть аккаунты в риске (${riskCount} шт.). Временно урежем активность, проверь Safe Mode.`);
    }

    // 4. Деньги
    const revenue = await pool.query(`
      SELECT SUM(expected_amount) FROM leads WHERE status='closed' AND created_at > NOW() - INTERVAL '3 days'
    `);

    const totalRev = Number(revenue.rows[0]?.sum || 0);
    if (totalRev === 0) {
      insights.push("Нет свежих зачислений. Нужно проверить качество трафика и прогрев.");
    } else {
      insights.push(`Хорошая динамика! Заработано ${totalRev.toLocaleString()} ₽ за последние 3 дня.`);
    }

    // 5. Обучение
    const stylesTest = await pool.query("SELECT COUNT(*) FROM learned_styles");
    const styleCount = Number(stylesTest.rows[0]?.count || 0);
    if (styleCount < 5) {
      insights.push("ИИ еще слабо знает твой стиль. Поотвечай клиентам вручную, чтобы собрать базу.");
    }

  } catch (error) {
    console.error("Insight generation failed:", error);
    insights.push("Сбор рекомендаций недоступен. Проверьте БД.");
  }

  return insights;
}
