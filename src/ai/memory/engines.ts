import { db } from '../../db.js';
import { analyzeStyle } from '../styleAnalyzer.js';
import { analyzeBehavior } from '../behaviorAnalyzer.js';

export async function syncUserProfiles(userId: string, chatId: string) {
  try {
    const res = await db.query(
      `SELECT role, message, created_at as timestamp FROM conversations WHERE user_id=$1 AND chat_id=$2 ORDER BY created_at ASC`,
      [userId, chatId]
    );

    if (res.rows.length === 0) return;

    // Filter user messages for style profile
    const userMessages = res.rows.filter((r: any) => r.role === 'user').map((r: any) => r.message);
    const style = analyzeStyle(userMessages);

    if (style) {
      await db.query(`
        INSERT INTO user_style_profiles (user_id, avg_length, emoji_usage, punctuation_style, slang_level)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (user_id) DO UPDATE SET
          avg_length = EXCLUDED.avg_length,
          emoji_usage = EXCLUDED.emoji_usage,
          punctuation_style = EXCLUDED.punctuation_style,
          slang_level = EXCLUDED.slang_level,
          updated_at = NOW()
      `, [userId, style.avgLength, style.emojiUsage, style.punctuationStyle, style.slangLevel]);
    }

    const behavior = analyzeBehavior(res.rows);
    if (behavior) {
      await db.query(`
        INSERT INTO user_behavior_profiles
        (user_id, avg_reply_delay, reply_probability, followup_probability, aggression_level, persistence_level)
        VALUES ($1,$2,$3,$4,$5,$6)
        ON CONFLICT (user_id) DO UPDATE SET
        avg_reply_delay = EXCLUDED.avg_reply_delay,
        reply_probability = EXCLUDED.reply_probability,
        followup_probability = EXCLUDED.followup_probability,
        aggression_level = EXCLUDED.aggression_level,
        persistence_level = EXCLUDED.persistence_level,
        updated_at = NOW()
      `, [userId, behavior.avg_reply_delay, behavior.reply_probability, behavior.followup_probability, behavior.aggression_level, behavior.persistence_level]);
    }
  } catch (e) {
    console.error('Error syncing profiles', e);
  }
}

export async function getUserStyle(userId: string) {
  try {
    const res = await db.query('SELECT * FROM user_style_profiles WHERE user_id = $1', [userId]);
    if (res.rows.length) return res.rows[0];
  } catch (e) {
    console.error('Error fetching user style', e);
  }
  return null;
}

export async function getUserBehavior(userId: string) {
  try {
    const res = await db.query('SELECT * FROM user_behavior_profiles WHERE user_id = $1', [userId]);
    if (res.rows.length) return res.rows[0];
  } catch (e) {
    console.error('Error fetching user behavior', e);
  }
  return null;
}

export async function getConversationState(chatId: string) {
  try {
    const res = await db.query('SELECT * FROM conversation_state WHERE chat_id = $1', [chatId]);
    if (res.rows.length) return res.rows[0];
  } catch (e) {
    console.error('Error fetching conversation state', e);
  }
  return null;
}

export async function updateConversationState(chatId: string, stage: string, intent: string) {
  try {
    await db.query(`
      INSERT INTO conversation_state (chat_id, stage, last_intent)
      VALUES ($1, $2, $3)
      ON CONFLICT (chat_id) DO UPDATE SET
      stage = EXCLUDED.stage,
      last_intent = EXCLUDED.last_intent,
      updated_at = NOW()
    `, [chatId, stage, intent]);
  } catch (e) {
    console.error('Error updating conversation state', e);
  }
}

export async function getGroupStyle(chatId: string) {
  try {
    const res = await db.query(`
      SELECT text FROM group_training_messages
      WHERE chat_id = $1
      ORDER BY created_at DESC
      LIMIT 30
    `, [chatId]);
    return analyzeStyle(res.rows.map((r: any) => r.text)) || {
      avg_length: 50, emoji_usage: 0, punctuation_style: 'normal', slang_level: 0
    };
  } catch (e) {
    console.error('Error fetching group style', e);
  }
  return null;
}

export function mergeStyles(user: any, group: any) {
  if (!user && !group) return null;
  if (!user) return group;
  if (!group) return user;
  
  return {
    avg_length: (user.avg_length + (group.avgLength || group.avg_length)) / 2,
    emoji_usage: Math.max(user.emoji_usage, (group.emojiUsage || group.emoji_usage)),
    punctuation_style: user.punctuation_style || group.punctuationStyle || group.punctuation_style,
    slang_level: Math.max(user.slang_level, (group.slangLevel || group.slang_level))
  };
}

export function detectStage(messages: any[]) {
  const last = String(messages[messages.length - 1]?.text || '').toLowerCase();
  const has = (rx: RegExp) => rx.test(last);
  if (has(/(^|[^а-яё])(пока|до свидания|до связи|всего доброго|всего хорошего|не надо|не пиши)([^а-яё]|$)/)) return 'closed';
  if (has(/(^|[^а-яё])(беру|заберу|куда платить|оплачу|давай оформим|оформляй)([^а-яё]|$)/)) return 'closing';
  if (has(/(^|[^а-яё])(дорого|подумаю|дороговато|не уверен)([^а-яё]|$)/)) return 'objection';
  if (messages.length < 2) return 'greeting';
  if (has(/(^|[^а-яё])(цена|сколько|стоимость|почём|почем|прайс)([^а-яё]|$)/)) return 'offer';
  if (has(/^(ок|окей|ok|хорошо|ладно)[\s.!)]*$/)) return 'closing';
  return 'qualification';
}

export function detectIntent(text: string) {
  const t = text.toLowerCase();
  if (t.includes('сколько') || t.includes('цена')) return 'price';
  if (t.includes('как') || t.includes('где')) return 'info';
  if (t.includes('не надо') || t.includes('отмена')) return 'reject';
  if (t.includes('интересно') || t.includes('хочу')) return 'interest';
  return 'unknown';
}
