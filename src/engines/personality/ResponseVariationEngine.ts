import { db as pool } from '../../db.js';

export class ResponseVariationEngine {
  // На production in-memory Map сбрасывается при деплое/рестарте и не скейлится.
  // Переносим логику на persistent storage (PostgreSQL/Redis)
  
  static async getVariedPhrase(userId: string, intent: 'greeting' | 'ack' | 'closing'): Promise<string> {
    const variantDictionary = {
      'greeting': ['привет', 'тут', 'на связи', 'приветствую', 'да, я здесь', 'ага'],
      'ack': ['понял', 'ок', 'принял', 'добро', 'сделаем', 'без проблем'],
      'closing': ['на связи', 'давай', 'добро', 'пиши если что']
    };

    const targetCategory = variantDictionary[intent] || ['ок'];
    
    // 1. Fetch from DB (Simulating Redis: user:123:recent_phrases)
    let recent: string[] = [];
    try {
      const res = await pool.query('SELECT recent_phrases FROM user_phrase_history WHERE user_id = $1', [userId]);
      if (res.rows.length > 0) {
        recent = res.rows[0].recent_phrases || [];
      }
    } catch (e) {
      // Table might not exist yet, cascade gracefully
    }

    // 2. Compute varied phrase
    let chosenPhrase = targetCategory[0];
    for (const v of targetCategory) {
      if (!recent.includes(v)) {
        chosenPhrase = v;
        break;
      }
    }

    // 3. Update memory
    recent.push(chosenPhrase);
    if (recent.length > 4) recent.shift(); // Keep last 4
    
    // 4. Save to DB asynchronously (fire and forget)
    // Assuming a background migration has created user_phrase_history table
    pool.query(`
      INSERT INTO user_phrase_history (user_id, recent_phrases, updated_at)
      VALUES ($1, $2, NOW())
      ON CONFLICT (user_id) DO UPDATE 
      SET recent_phrases = EXCLUDED.recent_phrases, updated_at = NOW()
    `, [userId, JSON.stringify(recent)]).catch(() => {});

    return chosenPhrase;
  }
}
