export interface MarketEntry {
  seller: string;
  product: string;
  price: number;
  currency: string;
  quantity?: number;
  rawText: string;
  timestamp: number;
}

export class TelegramMarketScanner {
  // Mock scanner for demonstration
  static scanChannels(): MarketEntry[] {
    return [
      {
        seller: 'vape_opt_ru',
        product: 'hqd_cuvie',
        price: 350,
        currency: 'RUB',
        quantity: 100,
        rawText: 'HQD Cuvie оптом 350р от 100шт',
        timestamp: Date.now()
      }
    ];
  }
}
