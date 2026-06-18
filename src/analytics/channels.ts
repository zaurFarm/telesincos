import { db as pool } from '../db.js';

export async function getBestChannels() {
  try {
    const res = await pool.query(`
      SELECT source_chat as source_channel, 
             COUNT(*) as leads,
             SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as sales
      FROM leads
      WHERE source_chat IS NOT NULL
      GROUP BY source_chat
      ORDER BY sales DESC, leads DESC
      LIMIT 10
    `);
    
    return res.rows || [];
  } catch (e) {
    console.error('Failed to get best channels', e);
    return [];
  }
}

export async function getBestMessageVariants() {
  try {
    const res = await pool.query(`
      SELECT id, 
             type,
             variant_text as text,
             reply_count as replies,
             engagement_score as engagement,
             conversion_count as conversions,
             sent_count as total_uses,
             (reply_count * 0.5 + engagement_score * 0.3 + conversion_count * 0.2 - block_count * 0.5) as score,
             is_active
      FROM message_variants
      ORDER BY score DESC, total_uses DESC
      LIMIT 20
    `);
    return res.rows || [];
  } catch (e) {
    console.error('Failed to get best message variants', e);
    return [];
  }
}

export async function getAccountEfficiency() {
  try {
    const res = await pool.query(`
      SELECT id, phone, status, role, trust_score, reply_rate, block_events, performance_score as score, sent_today
      FROM farm_accounts
      ORDER BY performance_score DESC NULLS LAST
    `);
    return res.rows || [];
  } catch (e) {
    console.error('Failed to get account efficiency', e);
    return [];
  }
}

