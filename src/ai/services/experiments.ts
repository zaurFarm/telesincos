import { db } from '../../db.js';

export async function getActiveExperiment() {
  try {
    const res = await db.query(`
      SELECT * FROM ai_experiments
      WHERE winner IS NULL AND ended_at IS NULL
      ORDER BY started_at DESC
      LIMIT 1
    `);
    return res.rows[0];
  } catch (e) {
    return null;
  }
}

export async function getActiveExperiments() {
    try {
        const res = await db.query(`
            SELECT * FROM ai_experiments
            WHERE winner IS NULL AND ended_at IS NULL
        `);
        return res.rows;
    } catch(e) {
        return [];
    }
}

export async function evaluateExperiment(id: number) {
  try {
    const res = await db.query(`
      SELECT strategy,
             AVG(replied::int) as reply_rate,
             AVG(converted::int) as conversion,
             SUM(revenue) as revenue
      FROM ai_metrics
      WHERE experiment_id = $1
      GROUP BY strategy
    `, [id]);

    if (res.rows.length === 0) return null;

    const winner = res.rows.sort((a, b) => b.revenue - a.revenue)[0];

    // Assuming we end it explicitly elsewhere or here
    await db.query(`
      UPDATE ai_experiments
      SET winner = $1, ended_at = NOW()
      WHERE id = $2
    `, [winner.strategy, id]);

    return winner;
  } catch (e) {
    console.error('Failed to evaluate experiment', e);
    return null;
  }
}

let globalBrainCache: any = null;

export async function updateDecisionEngine(data: any) {
    globalBrainCache = data;
    // In a real app we'd save this to `bot_settings` or `global_brain` table
}

export async function getGlobalStrategy() {
    return globalBrainCache;
}

export async function applyWinner(experimentId: number) {
  const exp = await evaluateExperiment(experimentId);
  if (exp) {
      await updateDecisionEngine({
        preferredStrategy: exp.strategy
      });
      console.log(`[AI LEARNING] Global Brain updated to strategy: ${exp.strategy}`);
  }
}

export async function logExperimentMetric({
    userId, experimentId, strategy, replied, converted, revenue
}: any) {
    try {
        await db.query(`
            INSERT INTO ai_metrics
            (user_id, experiment_id, strategy, replied, converted, revenue)
            VALUES ($1,$2,$3,$4,$5,$6)
        `, [
            String(userId),
            experimentId || null,
            strategy,
            replied ? 1 : 0,
            converted ? 1 : 0,
            revenue || 0
        ]);
    } catch(e) {
        console.error('Failed to log experiment metric', e);
    }
}
