import { db } from '../db.js';

export async function addPattern(type: 'banned_word' | 'bad_pattern' | 'working_strategy', value: string, initialScore: number = 0) {
  try {
    await db.query(`
      INSERT INTO global_brain (pattern_type, pattern_value, score, uses)
      VALUES ($1, $2, $3, 1)
    `, [type, value, initialScore]);
  } catch (e: any) {
    console.error('[GlobalBrain] addPattern error', e.message);
  }
}

export async function getPatterns(type: 'banned_word' | 'bad_pattern' | 'working_strategy') {
  try {
    const res = await db.query(`
      SELECT pattern_value, score FROM global_brain
      WHERE pattern_type = $1
      ORDER BY score DESC
    `, [type]);
    return res.rows;
  } catch(e: any) {
      console.error('[GlobalBrain] getPatterns error', e.message);
      return [];
  }
}

// System can call this to see if a generated message contains banned patterns
export async function isMessageRisky(message: string): Promise<boolean> {
  const badPatterns = await getPatterns('banned_word');
  const msgLower = message.toLowerCase();
  
  for (const p of badPatterns) {
      if (msgLower.includes(p.pattern_value.toLowerCase())) {
          return true; // Match found
      }
  }
  return false;
}
