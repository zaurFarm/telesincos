import { db as pool } from "../db.js";

export async function calculateLeadScore(lead: any) {
  let score = 0;

  // 1. Намерение (Intent)
  if (lead.intent === 'buy') score += 0.4;
  else if (lead.intent === 'inquiry') score += 0.2;

  // 2. Температура (Temperature)
  if (lead.temperature === 'hot') score += 0.3;
  else if (lead.temperature === 'warm') score += 0.15;

  // 3. Доверие (Trust)
  try {
    const trustRes = await pool.query(
      "SELECT trust_score FROM relationship_memory WHERE user_id = $1", 
      [lead.user_id]
    );
    const trust = trustRes.rows[0]?.trust_score || 0.5;
    score += trust * 0.3;
  } catch (e) {
    score += 0.15; // Fallback trust
  }

  // 4. Поведение (Behavior)
  try {
    const convs = await pool.query(
      "SELECT role, message, created_at FROM conversations WHERE lead_id = $1 ORDER BY created_at DESC", 
      [lead.id]
    );
    const messages = convs.rows;
    
    if (messages.length > 0) {
      // Asked price?
      const askedPrice = messages.some((m: any) => 
        m.role === 'user' && (
          m.message.toLowerCase().includes('цена') || 
          m.message.toLowerCase().includes('сколько') || 
          m.message.toLowerCase().includes('почем') ||
          m.message.toLowerCase().includes('оплат')
        )
      );
      if (askedPrice) score += 0.2;

      // Long messages? (avg > 40 chars)
      const userMsgs = messages.filter((m: any) => m.role === 'user');
      if (userMsgs.length > 0) {
        const avgLen = userMsgs.reduce((acc: number, m: any) => acc + m.message.length, 0) / userMsgs.length;
        if (avgLen > 40) score += 0.1;
      }

      // Fast reply?
      if (messages.length >= 2) {
         const lastUser = messages.find((m: any) => m.role === 'user');
         const lastAssistant = messages.find((m: any) => m.role === 'assistant');
         if (lastUser && lastAssistant) {
            const diff = Math.abs(new Date(lastUser.created_at).getTime() - new Date(lastAssistant.created_at).getTime());
            if (diff < 1000 * 60 * 5) score += 0.1;
         }
      }
    }
  } catch (e) {
    console.error("Behavior scoring failed", e);
  }

  // 5. Коррекция по стадии
  if (lead.stage === 'ready') score += 0.2;
  if (lead.stage === 'objection') score -= 0.1;

  // Итоговый результат 0-100
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}
