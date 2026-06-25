import { db } from '../db.js';
import { getEmbedding } from '../ai/embedding.js';
import stringSimilarity from 'string-similarity';

const SIMILARITY_THRESHOLD = 0.85; // higher = stricter
const MAX_HISTORY = 30;

export async function checkSimilarity(accountId: string, text: string) {
  try {
    const embedding = await getEmbedding(text);

    if (embedding.length > 0) {
        const res = await db.query(
          `
          SELECT text, embedding <-> $1 AS distance
          FROM account_messages
          WHERE account_id = $2
          ORDER BY embedding <-> $1
          LIMIT 5
          `,
          [JSON.stringify(embedding), accountId]
        );

        if (!res.rows.length) {
          return { isSimilar: false, embedding };
        }

        const minDistance = res.rows[0].distance;
        // pgvector cosine distance -> 0 = identical
        const similarity = 1 - minDistance;

        return {
          isSimilar: similarity > SIMILARITY_THRESHOLD,
          similarity,
          embedding
        };
    }
  } catch (e) {
    console.error('[SimilarityGuard] checking embedding similarity failed:', e);
  }

  return await checkSimilarityFallback(accountId, text);
}

export async function checkSimilarityFallback(accountId: string, text: string) {
    console.log('[SimilarityGuard] Using fallback simple string similarity.');
    try {
        const res = await db.query(
          `
          SELECT text
          FROM account_messages
          WHERE account_id = $1
          ORDER BY created_at DESC
          LIMIT $2
          `,
          [accountId, MAX_HISTORY]
        );

        const history = res.rows.map(r => r.text);
        if (history.length === 0) return { isSimilar: false, embedding: null };

        for (const old of history) {
            const score = stringSimilarity.compareTwoStrings(text, old);
            if (score > 0.8) {
              return { isSimilar: true, similarity: score, embedding: null };
            }
        }
    } catch (err) {
        console.error('[SimilarityGuard] fallback check failed:', err);
    }
    
    return { isSimilar: false, embedding: null };
}

export async function saveAccountMessage(accountId: string, text: string, embedding: number[] | null) {
  try {
      await db.query(
        `
        INSERT INTO account_messages (account_id, text, embedding)
        VALUES ($1, $2, $3)
        `,
        [accountId, text, embedding ? JSON.stringify(embedding) : null]
      );

      // Clean old messages for this account
      await db.query(
        `
        DELETE FROM account_messages
        WHERE id IN (
          SELECT id FROM account_messages
          WHERE account_id = $1
          ORDER BY created_at DESC
          OFFSET $2
        )
        `,
        [accountId, MAX_HISTORY]
      );
  } catch (e) {
      console.error('[SimilarityGuard] failed to save message:', e);
  }
}

export function mutateText(text: string) {
  if (!text || typeof text !== 'string') return text || '';
  return text
    .replace(/да(\s|,|$)/ugi, 'ага$1')
    .replace(/есть/ugi, 'в наличии')
    .replace(/могу/ugi, 'смогу')
    .replace(/цена/ugi, 'по цене')
    .replace(/\.$/ugi, ' 👌')
    .replace(/привет/ugi, 'здравствуйте')
    .replace(/ок/ugi, 'хорошо')
    .replace(/супер/ugi, 'отлично');
}
