import { getBestVariantFromDB } from '../../server.js';
import { db } from '../db.js';

export async function getBestVariant(type: string): Promise<string | null> {
  return await getBestVariantFromDB(type);
}

export async function learnFromSales() {
  try {
    const res = await db.query(`
      SELECT intent, temperature, COUNT(*) as total,
             SUM(CASE WHEN status='closed' THEN 1 ELSE 0 END) as success
      FROM leads
      GROUP BY intent, temperature
    `);

    return res.rows.map((r: any) => ({
      ...r,
      conversion: Number(r.total) > 0 ? Number(r.success) / Number(r.total) : 0
    }));
  } catch (e) {
    console.error("Optimizer learn fail", e);
    return [];
  }
}

export function adjustStrategy(conversion: number) {
  if (conversion > 0.3) return 'aggressive';
  if (conversion > 0.15) return 'normal';
  return 'soft';
}
