import { db } from '../db.js';

export async function getMemory(userId: string) {
  const res = await db.query(
    `SELECT * FROM relationship_memory WHERE user_id = $1 LIMIT 1`,
    [userId]
  );

  if (res.rows.length > 0) return res.rows[0];

  // создаём если нет
  const insert = await db.query(
    `INSERT INTO relationship_memory (user_id) VALUES ($1) RETURNING *`,
    [userId]
  );

  return insert.rows[0];
}

export async function updateMemory(userId: string, text: string) {
  const memory = await getMemory(userId);

  let trust = memory.trust_score;
  let positive = memory.positive_events;
  let negative = memory.negative_events;

  const lower = text.toLowerCase();

  // позитив
  if (lower.includes("беру") || lower.includes("ок") || lower.includes("давай")) {
    trust += 0.1;
    positive++;
  }

  // негатив
  if (lower.includes("гарантии") || lower.includes("обман") || lower.includes("мошенник") || lower.includes("кидалово")) {
    trust -= 0.15;
    negative++;
  }

  // нормализация
  if (trust > 1) trust = 1;
  if (trust < 0) trust = 0;

  const res = await db.query(
    `UPDATE relationship_memory 
     SET trust_score = $1,
         positive_events = $2,
         negative_events = $3,
         message_count = message_count + 1,
         last_interaction = NOW()
     WHERE user_id = $4
     RETURNING *`,
    [trust, positive, negative, userId]
  );
  
  if (res.rows.length > 0) {
      return res.rows[0];
  }

  return memory;
}

export function getEmotionBias(memory: any) {
  if (memory.negative_events > 3) return "annoyed";
  if (memory.positive_events > 5) return "friendly";
  if (memory.trust_score > 0.8) return "warm";
  return "neutral";
}
