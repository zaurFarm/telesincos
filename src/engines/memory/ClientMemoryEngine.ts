import { db as pool } from '../../db.js';

export interface Interest {
  tag: string;
  score: number;
  lastMentioned: Date;
}

export interface ClientProfile {
  userId: string;
  username: string;
  topInterests: Interest[];
  trustScore: number;
  tone: 'formal' | 'casual' | 'short' | 'emoji';
  lastInteraction: Date;
  status: 'cold' | 'warm' | 'hot' | 'timewaster';
  dealHistory?: string[];
}

export class ClientMemoryEngine {
  
  // Update interests with deduplication and time-based decay
  static updateInterests(current: Interest[], newTags: string[]): Interest[] {
    const limits = 10;
    const now = new Date();
    const updated = [...current];

    // Decay existing scores slightly to prioritize recent ones
    updated.forEach(i => {
      const daysOld = (now.getTime() - new Date(i.lastMentioned).getTime()) / (1000 * 3600 * 24);
      i.score = Math.max(0, i.score - (daysOld * 0.01)); 
    });

    for (const tag of newTags) {
      const existing = updated.find(i => i.tag === tag);
      if (existing) {
        existing.score = Math.min(1.0, existing.score + 0.2);
        existing.lastMentioned = now;
      } else {
        updated.push({ tag, score: 0.5, lastMentioned: now });
      }
    }

    return updated
      .sort((a, b) => b.score - a.score)
      .slice(0, limits);
  }

  // Dynamic trust score: increases based on positive actions, but decays if silent
  static calculateTrustScore(currentScore: number, action: 'reply' | 'ask_delivery' | 'hesitate' | 'ignore', daysSinceLastMsg: number): number {
    let score = currentScore;
    
    // Time decay
    const decay = daysSinceLastMsg * 0.02;
    score = Math.max(0, score - decay);

    // Action impact
    switch (action) {
      case 'reply': score = Math.min(1.0, score + 0.05); break;
      case 'ask_delivery': score = Math.min(1.0, score + 0.15); break;
      case 'hesitate': score = Math.max(0, score - 0.05); break;
      case 'ignore': score = Math.max(0, score - 0.1); break;
    }

    return parseFloat(score.toFixed(2));
  }

  static async loadProfile(userId: string): Promise<ClientProfile | null> {
    try {
      const res = await pool.query('SELECT profile_data FROM client_profiles WHERE user_id = $1', [userId]);
      if (res.rows.length === 0) return null;
      return res.rows[0].profile_data as ClientProfile;
    } catch {
      return null;
    }
  }

  static async saveProfile(profile: ClientProfile) {
    await pool.query(`
      INSERT INTO client_profiles (user_id, username, profile_data)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE 
      SET username = EXCLUDED.username, 
          profile_data = EXCLUDED.profile_data,
          updated_at = NOW()
    `, [profile.userId, profile.username, JSON.stringify(profile)]);
  }
}
