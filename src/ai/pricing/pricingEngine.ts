export function calculatePrice(basePrice: number, type: 'opt' | 'retail' | 'rozn' | 'curious' | string, context?: any) {
  let price = basePrice;
  if (type === 'opt' || type === 'wholesale') {
      price = basePrice * 1.05;
  } else {
      price = basePrice * 1.10; // default retail markup
  }
  
  if (context) {
     if (context.demand === 'high') price *= 1.15;
     if (context.trustScore > 70) price *= 1.1;
     if (context.negotiation === 'aggressive') price *= 0.9;
  }
  
  return Math.round(price);
}

export function extractPrice(text: string): number | null {
  const match = text.match(/\b\d{2,5}\b/);
  if (match) {
    const num = parseInt(match[0], 10);
    if (num >= 50 && num <= 100000) return num;
  }
  return null;
}
