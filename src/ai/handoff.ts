import { db } from '../db.js';

export function wantsHuman(text: string) {
  const t = text.toLowerCase();
  return [
    'менеджер',
    'человек',
    'живой',
    'оператор',
    'свяжи',
    'позови'
  ].some(k => t.includes(k));
}

export async function markAsHumanNeeded(userId: string | number) {
  try {
    await db.query(`UPDATE leads SET needs_human = TRUE WHERE user_id = $1`, [String(userId)]);
  } catch (e) {
    console.error('Failed to mark human needed', e);
  }
}

export async function needsHuman(userId: string | number) {
  try {
    const res = await db.query(`SELECT needs_human FROM leads WHERE user_id = $1`, [String(userId)]);
    return res.rows[0]?.needs_human === true;
  } catch (e) {
    return false;
  }
}
