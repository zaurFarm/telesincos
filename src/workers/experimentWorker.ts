import { db } from '../db.js';
import { evaluateExperiment, applyWinner } from '../ai/services/experiments.js';
import { disableWeakVariants, cooldownOverusedVariants, generateNewVariants } from '../ai/evolution.js';

export async function processExperiments() {
    try {
        const workspacesRes = await db.query(`SELECT id::text FROM workspaces`);
        
        for (const workspace of workspacesRes.rows) {
            await db.withTenant(workspace.id, async (client) => {
                const active = await client.query(`
                    SELECT * FROM ai_experiments
                    WHERE winner IS NULL AND ended_at IS NULL
                `);

                for (const exp of active.rows) {
                    const res = await client.query(`SELECT COUNT(*) as cnt FROM ai_metrics WHERE experiment_id = $1`, [exp.id]);
                    if (Number(res.rows[0].cnt) >= 20) {
                       await applyWinner(exp.id);
                    }
                }
                
                // Find which types of messages have variants, and evolve them
                const typesRes = await client.query(`SELECT DISTINCT type FROM message_variants`);
                for (const t of typesRes.rows) {
                    await generateNewVariants(t.type);
                }
            });
        }
        
        // Auto-Evolution logic
        console.log('[ExperimentWorker] Running Auto-Evolution tasks...');
        await disableWeakVariants();
        await cooldownOverusedVariants();

    } catch (e) {
        console.error('[ExperimentWorker] Error', e);
    }
}

let experimentInterval: ReturnType<typeof setInterval>;

export function startExperimentWorker() {
  experimentInterval = setInterval(async () => {
    const { acquireLock } = await import('../system/locks.js');
    const locked = await acquireLock('cron_experiments', 30 * 60 * 1000); // 30m lock
    if (locked) {
       await processExperiments();
    }
  }, 60 * 60 * 1000);
}

export function stopExperimentWorker() {
  if (experimentInterval) clearInterval(experimentInterval);
}
