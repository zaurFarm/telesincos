export interface OneCProductData {
  sku: string;
  purchasePrice: number;
  stock: number;
  salesVelocity: number;
}

export class OneCIntegration {
  static async fetchProductData(sku: string): Promise<OneCProductData | null> {
    // Mock 1C response
    return {
      sku,
      purchasePrice: 300,
      stock: 120,
      salesVelocity: 14
    };
  }
}
