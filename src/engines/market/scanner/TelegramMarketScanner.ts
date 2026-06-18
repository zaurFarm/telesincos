import { db } from '../../../db.js';

export interface MarketEntry {
  seller: string;
  product: string;
  price: number;
  currency: string;
  quantity?: number;
  rawText: string;
  timestamp: number;
}

/**
 * Extracts price/product offers from real Telegram messages collected by the userbot.
 * No mock data: if there are no matching messages, it returns an empty array.
 *
 * Heuristic parsing tuned for Russian b2b wholesale listings, e.g.:
 *   "HQD Cuvie оптом 350р от 100шт"
 *   "Айфон 15 pro - 65000 руб"
 */
export class TelegramMarketScanner {
  // Match a price like "350р", "65 000 руб", "1200₽", "350 rub"
  private static PRICE_RE = /(\d[\d\s.]{0,9}\d|\d)\s*(?:р|руб|rub|₽)\b/i;
  // Optional quantity like "от 100шт", "100 шт"
  private static QTY_RE = /(?:от\s*)?(\d{1,6})\s*(?:шт|штук|pcs)\b/i;

  static parseMessage(text: string): { product: string; price: number; quantity?: number } | null {
    if (!text) return null;
    const priceMatch = text.match(this.PRICE_RE);
    if (!priceMatch) return null;

    const price = Number(priceMatch[1].replace(/[\s.]/g, ''));
    if (!price || price <= 0) return null;

    const qtyMatch = text.match(this.QTY_RE);
    const quantity = qtyMatch ? Number(qtyMatch[1]) : undefined;

    // Product name = text with the price fragment stripped, trimmed to something readable
    let product = text.replace(priceMatch[0], '').replace(/\s+/g, ' ').trim();
    product = product.replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, '').slice(0, 200);
    if (!product) product = 'unknown';

    return { product, price, quantity };
  }

  /**
   * Scan recently collected messages and persist any detected offers into competitor_data.
   * Returns the structured entries found this run.
   */
  static async scanChannels(limit = 500): Promise<MarketEntry[]> {
    const entries: MarketEntry[] = [];

    let rows: any[] = [];
    try {
      const res = await db.query(
        `SELECT account_id AS seller, text, created_at
         FROM account_messages
         WHERE text IS NOT NULL AND text <> ''
         ORDER BY created_at DESC
         LIMIT $1`,
        [limit]
      );
      rows = res.rows || [];
    } catch (e: any) {
      console.error('[MarketScanner] Failed to read messages:', e.message);
      return entries;
    }

    for (const row of rows) {
      const parsed = this.parseMessage(row.text);
      if (!parsed) continue;

      const entry: MarketEntry = {
        seller: row.seller || 'unknown',
        product: parsed.product,
        price: parsed.price,
        currency: 'RUB',
        quantity: parsed.quantity,
        rawText: row.text,
        timestamp: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
      };
      entries.push(entry);

      // Persist into competitor_data (dedup on seller + product_text + price)
      try {
        await db.query(
          `INSERT INTO competitor_data (group_name, seller, product_text, price, created_at)
           SELECT $1, $2, $3, $4, NOW()
           WHERE NOT EXISTS (
             SELECT 1 FROM competitor_data
             WHERE seller = $2 AND product_text = $3 AND price = $4
           )`,
          ['telegram', entry.seller, entry.product, String(entry.price)]
        );
      } catch (e: any) {
        console.error('[MarketScanner] Failed to persist entry:', e.message);
      }
    }

    return entries;
  }
}
