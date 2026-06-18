export function computeLeadScore(text: string, contextArray: string[], hasReplied: boolean): number {
  let score = 0;
  
  if (hasReplied) score += 2;
  if (text.length > 20) score += 1;
  if (text.includes('?')) score += 2;
  
  const textLower = text.toLowerCase();
  
  // keywords
  if (textLower.includes('цена') || textLower.includes('почем') || textLower.includes('стоимость')) score += 2;
  if (textLower.includes('купить') || textLower.includes('заказать') || textLower.includes('доставка')) score += 3;
  if (textLower.includes('опт') || textLower.includes('прайс')) score += 3;
  
  // negative intent
  if (textLower.includes('нет') || textLower.includes('не надо') || textLower.includes('неинтересно') || textLower.includes('отстань') || textLower.includes('дорого')) {
      score -= 3;
  }
  
  return score;
}
