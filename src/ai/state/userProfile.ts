import { db } from '../../db.js';

export interface UserProfile {
  userId: string;
  avgPrice: number;
  maxPrice: number;
  trustScore: number;
  isWholesale: boolean;
  lastProduct: string | null;
  negotiationStyle: string;
}

export async function getUserProfile(userId: string | number): Promise<UserProfile> {
  const res = await db.query(`SELECT * FROM user_profiles WHERE user_id=$1`, [String(userId)]);
  
  if (res.rows.length === 0) {
    return {
      userId: String(userId),
      avgPrice: 0,
      maxPrice: 0,
      trustScore: 0.5,
      isWholesale: false,
      lastProduct: null,
      negotiationStyle: 'neutral'
    };
  }

  const row = res.rows[0];
  return {
    userId: row.user_id,
    avgPrice: parseFloat(row.avg_price || 0),
    maxPrice: parseFloat(row.max_price || 0),
    trustScore: parseFloat(row.trust_score || 0.5),
    isWholesale: row.is_wholesale === true,
    lastProduct: row.last_product,
    negotiationStyle: row.negotiation_style
  };
}

export async function updateUserProfile(profile: UserProfile): Promise<void> {
  try {
    await db.query(
      `INSERT INTO user_profiles (user_id, avg_price, max_price, trust_score, is_wholesale, last_product, negotiation_style, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (user_id) DO UPDATE SET
       avg_price = EXCLUDED.avg_price,
       max_price = EXCLUDED.max_price,
       trust_score = EXCLUDED.trust_score,
       is_wholesale = EXCLUDED.is_wholesale,
       last_product = EXCLUDED.last_product,
       negotiation_style = EXCLUDED.negotiation_style,
       updated_at = NOW()`,
      [
        profile.userId,
        profile.avgPrice,
        profile.maxPrice,
        profile.trustScore,
        profile.isWholesale,
        profile.lastProduct,
        profile.negotiationStyle
      ]
    );
  } catch (error) {
    console.error('⚠️ Failed to save user profile', error);
  }
}
