import { db } from '../db.js';

export interface VariantPerformace {
  id: number;
  variant_text: string;
  type: string;
  reply_count: number;
  engagement_score: number;
  conversion_count: number;
  block_count: number;
  sent_count: number;
  score: number;
}

export async function getTopVariants(type: string): Promise<VariantPerformace[]> {
  const result = await db.query(`
    SELECT *, 
           (reply_count * 0.5 + engagement_score * 0.3 + conversion_count * 0.2 - block_count * 0.5) as score 
    FROM message_variants
    WHERE type = $1 AND is_active = true 
      AND (cooldown_until IS NULL OR cooldown_until < NOW())
    ORDER BY score DESC
    LIMIT 5
  `, [type]);
  return result.rows;
}

export async function disableWeakVariants() {
  // Disable variants that have been tested enough but have terrible scores
  await db.query(`
    UPDATE message_variants 
    SET is_active = false
    WHERE sent_count >= 50 AND (reply_count * 0.5 + engagement_score * 0.3 + conversion_count * 0.2 - block_count * 0.5) < 0.1
  `);
}

export async function cooldownOverusedVariants() {
  await db.query(`
    UPDATE message_variants 
    SET cooldown_until = NOW() + interval '12 hours'
    WHERE sent_count > 200 AND cooldown_until IS NULL
  `);
}

export async function generateNewVariants(type: string) {
  const top = await getTopVariants(type);
  if (top.length === 0) return; // Need a seed first

  const examples = top.map(v => v.variant_text).join('\n—\n');
  
  const prompt = `Ты AI, оптимизирующий конверсию сообщений.
Вот текущие лучшие сообщения для "${type}":
—
${examples}
—
Возьми эти сообщения и создай 5 новых вариантов, которые будут:
- более естественными
- более короткими
- с высоким шансом ответа
- не похожи на ботов

Выведи только JSON массив строк.`;

  try {
    const { generateJSON } = await import('./provider.js');
    const newVariants = await generateJSON(prompt);
    
    if (Array.isArray(newVariants)) {
      for (const v of newVariants) {
        if (typeof v === 'string' && v.length > 5 && v.length < 500) {
          await db.query(`
            INSERT INTO message_variants (variant_text, type) 
            VALUES ($1, $2)
          `, [v.trim(), type]);
        }
      }
      console.log(`[Evolution] Generated ${newVariants.length} new variants for ${type}`);
    }
  } catch (e) {
    console.error("Failed to generate new variants", e);
  }
}

export async function pickVariant(type: string): Promise<{ id: number, text: string }> {
  // Fetch active non-cooldown variants
  const result = await db.query(`
    SELECT id, variant_text 
    FROM message_variants
    WHERE type = $1 AND is_active = true 
      AND (cooldown_until IS NULL OR cooldown_until < NOW())
    ORDER BY RANDOM()
    LIMIT 1
  `, [type]);

  if (result.rows.length > 0) {
    await db.query(`UPDATE message_variants SET sent_count = sent_count + 1 WHERE id = $1`, [result.rows[0].id]);
    return { id: result.rows[0].id, text: result.rows[0].variant_text };
  }

  // Fallback if empty
  const fallback = "Привет! Актуально?";
  const insert = await db.query(`INSERT INTO message_variants (variant_text, type, sent_count) VALUES ($1, $2, 1) RETURNING id`, [fallback, type]);
  return { id: insert.rows[0].id, text: fallback };
}

export async function logVariantPerformance(id: number, event: 'reply' | 'engagement' | 'conversion' | 'block', value: number = 1) {
  let col = '';
  if (event === 'reply') col = 'reply_count';
  else if (event === 'engagement') col = 'engagement_score';
  else if (event === 'conversion') col = 'conversion_count';
  else if (event === 'block') col = 'block_count';
  
  if (col) {
    await db.query(`UPDATE message_variants SET ${col} = ${col} + $1 WHERE id = $2`, [value, id]);
  }
}

export async function recordReplyToVariant(userId: string | number) {
  try {
    const res = await db.query(`
      SELECT variant_id 
      FROM decision_logs 
      WHERE user_id = $1 AND variant_id IS NOT NULL 
      ORDER BY created_at DESC 
      LIMIT 1
    `, [String(userId)]);
    
    if (res.rows.length > 0) {
      await logVariantPerformance(res.rows[0].variant_id, 'reply');
    }
  } catch (e) {
    console.error("Failed to record reply for variant", e);
  }
}
