import { db } from '../../db.js';

export async function logDecision(decision: {
  userId: string | number;
  input: string;
  riskLevel: string;
  intent: any;
  emotion: string;
  strategy: string;
  replyText: string;
  delayMs: number;
  leadScore?: number;
  variantId?: number;
}) {
  try {
    await db.query(
      `INSERT INTO decision_logs 
       (user_id, input, risk_level, intent, emotion, strategy, reply_text, delay_ms, lead_score, variant_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        String(decision.userId),
        decision.input,
        decision.riskLevel,
        JSON.stringify(decision.intent || {}),
        decision.emotion,
        decision.strategy,
        decision.replyText,
        decision.delayMs,
        decision.leadScore || 0,
        decision.variantId || null
      ]
    );
  } catch (error) {
    console.error('⚠️ Failed to store decision log:', error);
  }
}
