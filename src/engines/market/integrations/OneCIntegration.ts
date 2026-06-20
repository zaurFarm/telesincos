export interface OneCProductData {
  sku: string;
  purchasePrice: number;
  stock: number;
  salesVelocity: number;
}

/**
 * 1C / MoySklad integration.
 *
 * Not yet configured: returns null instead of fabricating purchase price / stock.
 * To enable, set ONEC_API_URL (+ ONEC_API_TOKEN) and implement the real fetch
 * in fetchFromOneC(). Until then callers MUST handle null as "cost unknown".
 */
export class OneCIntegration {
  static isConfigured(): boolean {
    return !!process.env.ONEC_API_URL;
  }

  static async fetchProductData(sku: string): Promise<OneCProductData | null> {
    if (!this.isConfigured()) {
      // Honest "no data" — do NOT return fabricated numbers.
      return null;
    }
    try {
      return await this.fetchFromOneC(sku);
    } catch (e: any) {
      console.error('[OneC] fetch failed:', e?.message);
      return null;
    }
  }

  // Real integration goes here once ONEC_API_URL is provided.
  private static async fetchFromOneC(_sku: string): Promise<OneCProductData | null> {
    // TODO: implement actual 1C/MoySklad HTTP call using ONEC_API_URL/ONEC_API_TOKEN.
    return null;
  }
}
