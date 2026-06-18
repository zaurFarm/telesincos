export const MARKET_EVENTS = {
    PRICE_UPDATED: 'MARKET_PRICE_UPDATED',
    UNDERCUT_DETECTED: 'MARKET_UNDERCUT_DETECTED',
    DEMAND_SPIKE: 'MARKET_DEMAND_SPIKE'
} as const;

export interface MarketPriceUpdatedPayload {
    productId: string;
    oldPrice: number;
    newPrice: number;
    competitorId?: string;
    timestamp: number;
}
