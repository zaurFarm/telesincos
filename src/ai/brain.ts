import { detectClientType } from './classifier.js';
import { getBestVariant } from './optimizer.js';
import { decideStrategy } from './strategy.js';
import { getDynamicPrice } from './pricing.js';
import { pickVariant as pickEvolvedVariant } from './evolution.js';

export async function decideNextAction({
  text,
  context,
  basePrice
}: {
  text: string;
  context: string;
  basePrice: number;
}) {
  const type = detectClientType(text);

  const strategy = decideStrategy(text, context);

  // Auto-Evolution routing replaces static hardcoded variant generator
  const evolved = await pickEvolvedVariant(type);

  const price = getDynamicPrice(basePrice, type);

  return {
    type,
    strategy,
    message: evolved.text,
    variantId: evolved.id, // we pass this to log it!
    price
  };
}
