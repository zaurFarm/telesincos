import { db } from '../../db.js';
import { getUserProfile, updateUserProfile, UserProfile } from './userProfile.js';
import { getUserStyle, getUserBehavior, getGroupStyle, getConversationState } from '../memory/engines.js';

export type DialogueState = {
  userId: string | number;
  chatId: string | number;

  stage: 'cold' | 'interest' | 'consideration' | 'ready';
  trustScore: number;
  emotion: string;
  relation: 'new' | 'neutral' | 'trusted';

  leadScore?: number;
  historyLength?: number;
  contextArray?: string[];

  userProfile: UserProfile;

  lastInteractionAt: number;
  messageCount: number;
  lastAccountId?: number;
  
  style?: any;
  behavior?: any;
  groupStyle?: any;
  conversationState?: any;
};

// In-memory cache or Redis could be used here. For simplicity and DB sync, we fetch context from DB.
export async function getState(userId: string | number, chatId: string | number): Promise<DialogueState> {
  const convRes = await db.query(
    `SELECT role, message, account_id FROM conversations WHERE user_id=$1 AND chat_id=$2 ORDER BY created_at DESC LIMIT 20`,
    [userId, chatId]
  );
  
  const leadRes = await db.query(`SELECT id FROM leads WHERE user_id = $1 AND source_chat = $2`, [userId, chatId]);
  let lastAccountId = undefined;

  for (const row of convRes.rows) {
      if (row.account_id) {
          lastAccountId = row.account_id;
          break; // latest account used
      }
  }

  const allConvRes = await db.query(`SELECT count(id) as c FROM conversations WHERE user_id=$1 AND chat_id=$2`, [userId, chatId]);
  const messageCount = allConvRes.rows[0]?.c || 0;

  const contextArray = convRes.rows.reverse().map(r => `${r.role === 'user' ? 'Client' : 'You'}: ${r.message}`);
  
  const userProfile = await getUserProfile(userId);
  
  const [style, behavior, groupStyle, conversationState] = await Promise.all([
     getUserStyle(String(userId)),
     getUserBehavior(String(userId)),
     getGroupStyle(String(chatId)),
     getConversationState(String(chatId))
  ]);

  return {
    userId,
    chatId,
    stage: 'cold',
    trustScore: userProfile.trustScore,
    emotion: 'neutral',
    relation: userProfile.trustScore > 0.8 ? 'trusted' : (userProfile.trustScore > 0.4 ? 'neutral' : 'new'),
    historyLength: convRes.rows.length,
    contextArray,
    userProfile,
    lastInteractionAt: Date.now(),
    messageCount,
    lastAccountId,
    style,
    behavior,
    groupStyle,
    conversationState
  };
}

export async function updateState(state: DialogueState): Promise<void> {
  await updateUserProfile(state.userProfile);
}
