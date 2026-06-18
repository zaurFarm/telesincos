import { calculateTrustScore } from '../trust.js';
import { calculatePrice } from '../pricing/pricingEngine.js';
import { getActiveExperiment, getGlobalStrategy } from '../services/experiments.js';

export async function decide({ input, state, analysis }: any) {
  let trustScore = calculateTrustScore({
    hasUsername: !!input.username,
    historyLength: state.historyLength || 0,
    text: input.text,
    inGroups: input.isGroup
  });

  if (state.userProfile) {
    trustScore = (trustScore + state.userProfile.trustScore) / 2; // Blend dynamic and static trust core
  }

  // --- BRAIN STRATEGY ---
  const experiment = await getActiveExperiment();
  const globalBrain = await getGlobalStrategy();
  
  let baseStrategy = 'nurture';
  if (globalBrain?.preferredStrategy) {
    baseStrategy = globalBrain.preferredStrategy;
  }

  let finalStrategy = baseStrategy;
  let activeExperimentId = null;

  if (experiment) {
    activeExperimentId = experiment.id;
    finalStrategy = Math.random() > 0.5
      ? experiment.strategy_a
      : experiment.strategy_b;
  }

  // Inject defaults into return objects below if they match fallbacks, 
  // but hardcoded conditionals override A/B tests if strictly necessary (like ignore)

  if (trustScore < 0.2) {
    return { shouldReply: false, strategy: 'ignore' };
  }

  // Group Awareness Check
  if (input.isGroup && analysis.alreadyOfferedGroup) {
      return { shouldReply: false, strategy: 'group_already_offered' };
  }

  // User Memory Check
  const basePrice = 2000;
  let clientType = analysis.clientType;
  if (state.userProfile?.isWholesale) {
    clientType = 'wholesale';
  }

  const finalPrice = calculatePrice(basePrice, clientType);

  if (state.userProfile) {
    if (state.userProfile.negotiationStyle === 'aggressive' && state.userProfile.maxPrice > 0 && state.userProfile.maxPrice < finalPrice) {
      return { shouldReply: true, strategy: 'soft_exit', delay: 2000, finalPrice, experimentId: activeExperimentId };
    }
  }

  if (analysis.seenByUser) {
      if (state.userProfile?.negotiationStyle === 'soft') {
          return { shouldReply: true, strategy: 'push_upsell', delay: 2500, finalPrice, experimentId: activeExperimentId };
      }
      // Switch strategy if already offered
      return { shouldReply: true, strategy: finalStrategy, delay: 3000, experimentId: activeExperimentId };
  }

  const isNew = (state.historyLength || 0) < 3;

  // Group wholesale logic: ask for acceptable price first
  if (input.isGroup && analysis.isWholesaleGroup && isNew) {
      return { shouldReply: true, strategy: 'ask_price', delay: 2000, experimentId: activeExperimentId };
  }

  // Price negotiation logic
  if (analysis.userPrice) {
      if (analysis.userPrice >= finalPrice) {
          return { shouldReply: true, strategy: 'sell_price_accepted', delay: 2000, finalPrice, experimentId: activeExperimentId };
      } else {
          return { shouldReply: true, strategy: 'sell_price_rejected', delay: 2000, finalPrice, experimentId: activeExperimentId };
      }
  }

  if (analysis.stage === 'ready' && trustScore > 0.7) {
    return {
      shouldReply: true,
      strategy: 'close',
      delay: 1500,
      finalPrice,
      experimentId: activeExperimentId
    };
  }

  return {
    shouldReply: true,
    strategy: finalStrategy, // A/B test or default
    delay: 3000,
    experimentId: activeExperimentId
  };
}
