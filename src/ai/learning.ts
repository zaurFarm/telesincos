import { db as pool } from '../db.js';

export async function saveWinningDialogue(leadId: number) {
  try {
    const res = await pool.query(
      `SELECT message FROM conversations WHERE lead_id = $1 AND role = 'assistant' ORDER BY id DESC LIMIT 10`,
      [leadId]
    );
    const messages = res.rows.reverse().map(r => r.message);

    for (const msg of messages) {
      // 🛡️ Quality Gate:
      // Drop short/useless msgs
      if (!msg || msg.length < 10) continue;
      // Drop typical spammy or toxic artifacts (basic list)
      if (msg.includes('http') || msg.toLowerCase().includes('перевод') || msg.toLowerCase().includes('скинь')) continue;

      // Deduplication check
      const dupCheck = await pool.query(`SELECT id FROM learned_styles WHERE reply_text = $1 LIMIT 1`, [msg]);
      if (dupCheck.rows.length > 0) continue;

      await pool.query(
        'INSERT INTO learned_styles (trigger_text, reply_text, context, intent, quality_score) VALUES ($1, $2, $3, $4, $5)',
        ['[winning_dialogue]', msg, 'history', 'sales_closed', 1.0]
      );
    }
    console.log(`🧠 Saved winning dialogue for lead ${leadId}`);
  } catch (e) {
    console.error("Failed to save winning dialogue", e);
  }
}
