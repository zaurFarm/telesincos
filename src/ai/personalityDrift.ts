import { db } from '../db.js';

export async function advanceCharacterDrift(basePrompt: string) {
  try {
    // Получаем общую стату успешных сделок 
    const res = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'closed') as closed_deals,
        COUNT(*) as total_leads 
      FROM leads
    `);
    
    const stats = res.rows[0];
    const closed = Number(stats.closed_deals) || 0;
    const total = Number(stats.total_leads) || 1;
    const winRate = closed / total;

    // Сдвиг личности
    let driftBias = "";

    if (closed > 50) {
      driftBias = "Ты уверенная в себе девушка, продажи идут отлично, ты немного наглая, но очаровательная. Знаешь себе цену.";
    } else if (winRate < 0.1 && total > 20) {
      driftBias = "Ты немного выгорела, продажи идут туго. Отвечаешь более сухо, без лишних эмоций, сразу по делу.";
    } else if (closed > 10) {
      driftBias = "Ты на опыте. Общаешься расслабленно, с легким юмором, как со старыми знакомыми.";
    } else {
      driftBias = "Ты стараешься быть приветливой и очень аккуратной, так как только начинаешь общаться с этой аудиторией.";
    }

    return `${basePrompt}\n\n[ТВОЕ ТЕКУЩЕЕ СОСТОЯНИЕ (ДРИФТ ЛИЧНОСТИ)]\n${driftBias}`;
  } catch (e) {
    console.error("Personality drift error", e);
    return basePrompt;
  }
}
