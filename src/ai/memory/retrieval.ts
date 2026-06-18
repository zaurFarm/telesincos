import { db } from '../../db.js';
import { createEmbedding } from './embedding.js';
import { getEmbedding } from '../embedding.js';

export async function getSimilarGroupMessages(text: string) {
  if (text.length < 10) return [];
  const embedding = await getEmbedding(text);
  if (!embedding || embedding.length === 0) return [];

  try {
    const res = await db.query(`
      SELECT text
      FROM group_training_messages
      ORDER BY embedding <-> $1::vector
      LIMIT 10
    `, [JSON.stringify(embedding)]);
    return res.rows.map(r => r.text);
  } catch (e) {
    console.error('[Retrieval] group training retrieval error:', e);
    return [];
  }
}

export async function saveGroupSalesMessage(chatId: string, userId: string, text: string) {
  if (text.length < 10) return;
  const embedding = await getEmbedding(text);
  if (!embedding || embedding.length === 0) return;
  
  try {
     await db.query(`
       INSERT INTO group_training_messages (chat_id, user_id, text, embedding, type)
       VALUES ($1, $2, $3, $4, 'sales')
     `, [chatId, userId, text, JSON.stringify(embedding)]);
  } catch(e) {
     console.error('[Retrieval] group sales training retrieval error:', e);
  }
}

export async function getSimilarMessages(text: string) {
  if (text.length < 10) return [];
  const embedding = await createEmbedding(text);
  if (!embedding) return [];

  try {
    const res = await db.query(`
      SELECT message, role
      FROM training_conversations
      WHERE embedding IS NOT NULL AND LENGTH(message) > 10
      ORDER BY embedding <-> $1::vector
      LIMIT 10
    `, [JSON.stringify(embedding)]);
    return res.rows;
  } catch (e) {
    console.error('Retrieval error:', e);
    return [];
  }
}

export async function saveTrainingMessage(chatId: string, userId: string, role: string, text: string) {
  if (text.length < 10) return;
  
  const embedding = await createEmbedding(text);
  if (!embedding) return;

  try {
    await db.query(`
      INSERT INTO training_conversations (chat_id, user_id, role, message, embedding)
      VALUES ($1, $2, $3, $4, $5::vector)
    `, [chatId, userId, role, text, JSON.stringify(embedding)]);
  } catch(e) {
    console.error('Save training msg error:', e);
  }
}
