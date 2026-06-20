import { generateSalesReply, generateSmartReply } from '../sales.js';
import { db } from '../../db.js';
import { getSimilarMessages, getSimilarGroupMessages } from '../memory/retrieval.js';
import { mergeStyles } from '../memory/engines.js';
import { pickVariant } from '../evolution.js';

export async function generate({ input, state, decision, analysis }: any) {
  // Track product offer to prevent duplicate pitching
  if (analysis.product && decision.shouldReply) {
      try {
          if (input.isGroup) {
             await db.query(`INSERT INTO group_offers (chat_id, product) VALUES ($1, $2)`, [String(input.chatId), analysis.product]);
          }
          await db.query(`INSERT INTO user_seen_products (user_id, product) VALUES ($1, $2)`, [String(input.userId), analysis.product]);
      } catch(e: any) { console.debug("[pipeline.generate] seen-product insert failed:", e?.message); }
  }

  // Use Auto-Evolved Variants for initial cold messages
  if (state.messageCount === 0 && (!decision.strategy || decision.strategy === 'nurture')) {
      const type = analysis.clientType || 'curious';
      const variant = await pickVariant(type);
      decision.variantId = variant.id;
      return variant.text;
  }

  if (decision.strategy === 'ask_price') {
      return "А какие цены для тебя вообще заходят сейчас?";
  }

  if (decision.strategy === 'sell_price_accepted') {
      return `Слушай, могу сделать примерно ${decision.finalPrice} ₽. Интересно?`;
  }

  if (decision.strategy === 'sell_price_rejected') {
      return `Честно, у меня выходит ${decision.finalPrice} ₽ — ниже не получится, к сожалению 🙏`;
  }

  if (decision.strategy === 'soft_exit') {
      return `Блин, за ${state.userProfile?.maxPrice || 'такую сумму'} точно не найду, у меня закуп дороже выходит 😅`;
  }

  if (decision.strategy === 'push_upsell') {
      return `Кстати, тебе ${analysis.product} всё ещё интересно? Могу сделать за ${decision.finalPrice} ₽.`;
  }

  if (decision.strategy === 'close') {
    return generateSalesReply(input.text);
  }

  // Retrieve Vector Memory for similar situations (hybrid learning)
  const similar = await getSimilarMessages(input.text);
  const groupExamples = input.isGroup ? await getSimilarGroupMessages(input.text) : [];
  
  const finalStyle = mergeStyles(state.style, state.groupStyle);

  // generateSmartReply(leadData, historyRaw, relationType, strategy, memoryBlock, groupExamples, style, behavior, conversationState)
  return generateSmartReply(
    {}, // Lead Data
    state.contextArray || [],
    state.relation || 'neutral',
    decision.strategy || 'nurture',
    similar,
    groupExamples,
    finalStyle,
    state.behavior,
    state.conversationState
  );
}
