import { db } from '../../db.js';

const FOLLOWUP_STEPS = [
  { delay: 10 * 60 * 1000, type: 'nudge' },       // 10 мин
  { delay: 60 * 60 * 1000, type: 'value' },       // 1 час
  { delay: 6 * 60 * 60 * 1000, type: 'scarcity' } // 6 часов
];

export async function scheduleFollowUp({ userId, chatId, leadId, stage }: any) {
  const now = Date.now();

  try {
    for (let i = 0; i < FOLLOWUP_STEPS.length; i++) {
        const step = FOLLOWUP_STEPS[i];

        await db.query(`
        INSERT INTO followups (user_id, chat_id, lead_id, stage, step, scheduled_at)
        VALUES ($1, $2, $3, $4, $5, to_timestamp($6 / 1000.0))
        `, [String(userId), String(chatId), leadId, stage, i, now + step.delay]);
    }
  } catch (e) {
      console.error('Failed to schedule follow-up', e);
  }
}
