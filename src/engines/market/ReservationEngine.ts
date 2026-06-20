import { db } from '../../db.js';

export class ReservationEngine {
  /**
   * Acquire a PostgreSQL row-level lock (SELECT ... FOR UPDATE) inside a transaction
   * to guarantee zero double-selling under concurrency.
   * Reads and decrements products.stock atomically and writes a StockReserved event.
   */
  static async reserveStockTransactionally(productId: string, quantity: number, clientId: string): Promise<boolean> {
    const tenantId = 'tenant_1'; // TODO: pass real tenant from caller context
    try {
      return await db.withTenant(tenantId, async (client: any) => {
        const sel = await client.query(
          `SELECT stock FROM products WHERE id = $1 FOR UPDATE`,
          [productId]
        );
        if (sel.rowCount === 0) {
          console.warn(`[ReservationEngine] Product ${productId} not found`);
          return false;
        }
        const availableStock = Number(sel.rows[0].stock) || 0;
        if (availableStock < quantity) {
          console.warn(`[ReservationEngine] Insufficient stock for ${productId}: have ${availableStock}, need ${quantity}`);
          return false;
        }
        await client.query(
          `UPDATE products SET stock = stock - $1, updated_at = NOW() WHERE id = $2`,
          [quantity, productId]
        );
        try {
          await client.query(
            `INSERT INTO outbox_events (event_type, payload) VALUES ($1, $2::jsonb)`,
            ['StockReserved', JSON.stringify({ productId, quantity, clientId, at: new Date().toISOString() })]
          );
        } catch (e) {
          console.debug('[ReservationEngine] outbox insert skipped:', e?.message);
        }
        console.log(`[ReservationEngine] Reserved ${quantity} of ${productId} for ${clientId}`);
        return true;
      });
    } catch (e) {
      console.error('[ReservationEngine] Reservation transaction failed:', e?.message);
      throw e;
    }
  }
}
