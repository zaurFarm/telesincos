import { db } from '../db.js';

export const idempotency = {
  /**
   * Tries to acquire a unique key. Returns true if successful (first time), false otherwise.
   */
  async ensure(key: string): Promise<boolean> {
    try {
      await db.query(
        `INSERT INTO idempotency_keys (key) VALUES ($1)`,
        [key]
      );
      return true;
    } catch (err: any) {
      // Unique violation
      if (err.code === '23505') {
        return false;
      }
      throw err;
    }
  },

  async cleanup(interval: string = '24 hours') {
    await db.query(
      `DELETE FROM idempotency_keys WHERE created_at < NOW() - INTERVAL $1`,
      [interval]
    );
  }
};
