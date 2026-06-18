import { ClientType } from './classifier.js';

export function getDynamicPrice(basePrice: number, type: ClientType): number {
  switch (type) {
    case 'wholesale':
      return basePrice - 200; // Example discount
    case 'reseller':
      return basePrice - 100;
    case 'retail':
      return basePrice;
    case 'curious':
      return basePrice + 200; // Higher price for curious
    case 'risky':
      return basePrice;
    default:
      return basePrice;
  }
}
