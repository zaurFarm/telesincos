import { getDb } from '../../db.js';

export class IdempotencyEngine {
  /**
   * Safe execution wrapper for critical operations (e.g., placing an order, reserving stock)
   */
  static async executeSafe<T>(
    idempotencyKey: string,
    actionName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const db = await getDb();
    const ts = new Date().toISOString();

    // 1. Try to record the idempotency key (if it exists, this throws unique constraint error)
    try {
      await db.run(
        `INSERT INTO idempotency_keys (key, action, created_at) VALUES ($1, $2, $3)`,
        [idempotencyKey, actionName, ts]
      );
    } catch (error: any) {
      if (error.message.includes('UNIQUE') || error.message.includes('duplicate')) {
        console.warn(`[Idempotency] Duplicate request caught for key ${idempotencyKey}. Skipping operation.`);
        throw new Error('IDEMPOTENCY_CONFLICT: Operation already processed.');
      }
      throw error;
    }

    // 2. Perform the operation (in a real system, you'd wrap this all in a transaction)
    try {
      const result = await operation();
      return result;
    } catch (opError) {
      // Setup cleanup on failure so it can be retried safely
      console.error(`[Idempotency] Operation failed for key ${idempotencyKey}. Cleaning up key.`, opError);
      await db.run(`DELETE FROM idempotency_keys WHERE key = $1`, [idempotencyKey]);
      throw opError;
    }
  }
}
