export class PriceValidator {
  static validate(price: number, marketMedian: number, sellerAgeDays: number, replies: number): { valid: boolean, suspicious: boolean } {
    const deviation = Math.abs(marketMedian - price) / marketMedian;
    
    if (price < marketMedian * 0.6) {
      return { valid: false, suspicious: true };
    }

    if (sellerAgeDays < 7 && deviation > 0.2) {
      return { valid: false, suspicious: true };
    }

    return { valid: true, suspicious: false };
  }
}
