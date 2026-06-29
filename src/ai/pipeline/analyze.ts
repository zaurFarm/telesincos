import { detectBuyingStage } from '../intent.js';
import { detectEmotion } from '../emotion.js';
import { detectClientType } from '../classifier.js';
import { extractPrice } from '../pricing/pricingEngine.js';
import { db } from '../../db.js';
import { getPersonality, updateMood } from '../personality.js';

export async function analyze(input: any, state: any) {
  const [intent, emotion] = await Promise.all([
    detectBuyingStage(input.text),
    detectEmotion(state.contextArray || [], { type: state.relation }, state.emotion)
  ]);

  const clientTypeStr = detectClientType(input.text); // 'opt' | 'rozn' | 'curious'
  const isWholesaleGroup = input.isGroup && (
    (state.contextArray || []).some(msg => msg.toLowerCase().includes('опт') || msg.toLowerCase().includes('партия')) || 
    input.text.toLowerCase().includes('опт') || 
    input.text.toLowerCase().includes('партия')
  );
  
  const userPrice = extractPrice(input.text);
  
  // Predict current product for tracking
  const product = intent.product || 'default_product';

  const textLow = input.text.toLowerCase();
  
  // Updating user profile memory PRO
  if (state.userProfile) {
    if (clientTypeStr === 'wholesale' || textLow.includes('опт')) {
      state.userProfile.isWholesale = true;
    }
    
    if (product !== 'default_product') {
      state.userProfile.lastProduct = product;
    }

    if (textLow.includes('дорого')) {
      if (userPrice) {
        state.userProfile.maxPrice = userPrice;
      } else {
        // Decrease implicitly
        state.userProfile.maxPrice = state.userProfile.maxPrice > 0 ? state.userProfile.maxPrice * 0.9 : 0; 
      }
      state.userProfile.negotiationStyle = 'aggressive';
    } else if (textLow.includes('беру') || textLow.includes('заберу')) {
      state.userProfile.trustScore = Math.min(1.0, state.userProfile.trustScore + 0.1);
      state.userProfile.negotiationStyle = 'soft';
    }
    
    if (userPrice) {
      // Update running average price
      const avg = state.userProfile.avgPrice || 0;
      state.userProfile.avgPrice = avg === 0 ? userPrice : (avg + userPrice) / 2;
    }
  }

  if (input.userId) {
    updateMood(String(input.userId), input.text);
    state.mood = getPersonality(String(input.userId)).mood;
  }

  let alreadyOfferedGroup = false;
  if (input.isGroup) {
      try {
          const gRes = await db.query(`SELECT 1 FROM group_offers WHERE chat_id=$1 AND product=$2 AND offered_at > NOW() - INTERVAL '24 hours'`, [String(input.chatId), product]);
          alreadyOfferedGroup = gRes.rowCount > 0;
      } catch (e: any) { console.debug("[pipeline.analyze] group_offers check failed:", e?.message); }
  }

  let seenByUser = false;
  if (input.userId) {
      try {
          const uRes = await db.query(`SELECT 1 FROM user_seen_products WHERE user_id=$1 AND product=$2`, [String(input.userId), product]);
          seenByUser = uRes.rowCount > 0;
      } catch (e) {}
  }

  return {
    intent,
    emotion,
    stage: intent.stage,
    clientType: clientTypeStr,
    isWholesaleGroup,
    userPrice,
    product,
    alreadyOfferedGroup,
    seenByUser
  };
}
