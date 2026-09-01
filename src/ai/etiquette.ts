import { db } from '../db.js';

export type Farewell = 'hard' | 'soft' | null;

const HARD_RX = /(^|[\s,.!])(пока|пока-пока|до свидания|до связи|до встречи|всего доброго|всего хорошего|удачи|бывай|прощай|не надо|не нужно|не пиши|не пишите|отстань|отпишись|bye|goodbye)([\s,.!)]|$)/i;
const SOFT_RX = /^(ок|окей|ok|хорошо|ладно|понял|поняла|понятно|ясно|спасибо|спс|благодарю|принял|принято)[\s,.!)👍👌🙏]*$/i;

export function detectFarewell(text: string): Farewell {
  const t = String(text || '').trim().toLowerCase();
  if (!t) return null;
  if (HARD_RX.test(t)) return 'hard';
  if (SOFT_RX.test(t)) return 'soft';
  return null;
}

const HARD_REPLIES = ['хорошо, до связи 👌', 'ок, всего доброго!', 'понял, если что — пишите', 'хорошо, на связи'];
const SOFT_REPLIES = ['обращайтесь 👌', 'рад помочь, пишите если что', 'ок, на связи'];

export function farewellReply(kind: Farewell): string {
  const pool = kind === 'hard' ? HARD_REPLIES : SOFT_REPLIES;
  return pool[Math.floor(Math.random() * pool.length)];
}

const GREET_RX = /^\s*(привет|здравствуй|здравствуйте|добрый день|доброе утро|добрый вечер|доброй ночи|приветствую|хай|салют|hello|hi)\b/i;

export function looksLikeGreeting(text: string): boolean {
  return GREET_RX.test(String(text || ''));
}

export function greeting(): string {
  const h = (new Date().getUTCHours() + 3) % 24; // Москва
  if (h >= 5 && h < 11) return 'доброе утро';
  if (h >= 11 && h < 17) return 'добрый день';
  if (h >= 17 && h < 23) return 'добрый вечер';
  return 'привет';
}

export function ensureGreeting(text: string): string {
  const t = String(text || '').trim();
  if (!t || looksLikeGreeting(t)) return t;
  const first = t.charAt(0).toLowerCase() + t.slice(1);
  return `${greeting()}! ${first}`;
}

/** Здоровались ли мы уже в этом чате за последние 12 часов */
export async function greetedRecently(userId: string, chatId: string): Promise<boolean> {
  try {
    const res = await db.query(
      `SELECT max(created_at) AS last FROM conversations
       WHERE user_id = $1 AND chat_id = $2 AND role <> 'user'`,
      [userId, chatId]
    );
    const last = res.rows[0]?.last ? new Date(res.rows[0].last).getTime() : 0;
    return last > 0 && Date.now() - last < 12 * 60 * 60 * 1000;
  } catch {
    return true;
  }
}
