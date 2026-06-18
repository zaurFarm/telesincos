import { tgQueue } from '../queue/index.js';
import { db } from '../db.js';
import { getUserProfile } from '../ai/state/userProfile.js';
import { logMetric } from '../ai/services/metrics.js';

export async function processFollowups() {
    try {
        // Find all active workspaces/tenants to process cron job properly under RLS
        const workspacesRes = await db.query(`SELECT id::text FROM workspaces`);
        
        for (const workspace of workspacesRes.rows) {
            await db.withTenant(workspace.id, async (client) => {
                const due = await client.query(`
                    SELECT * FROM followups
                    WHERE sent = false AND scheduled_at <= NOW()
                `);

                for (const f of due.rows) {
                    // Should NOT followup if lead status changed
                    const leadRes = await client.query(`SELECT status, needs_human FROM leads WHERE id=$1`, [f.lead_id]);
                    if (!leadRes.rows.length) continue;
                    
                    const lead = leadRes.rows[0];
                    if (lead.needs_human || lead.status === 'closed' || lead.status === 'lost' || lead.status === 'rejected') {
                        await client.query(`UPDATE followups SET sent = true WHERE id = $1`, [f.id]);
                        continue;
                    }

                    const text = await generateFollowUpText(f);

                    if (text) {
                        await tgQueue.add('sendMessage', {
                            chatId: f.chat_id,
                            userId: f.user_id,
                            text,
                            accountId: 'main',
                            stage: f.stage
                        });

                        await logMetric({
                            event: 'followup_sent',
                            userId: f.user_id,
                            chatId: f.chat_id,
                            meta: { step: f.step }
                        });
                    }

                    await client.query(`UPDATE followups SET sent = true WHERE id = $1`, [f.id]);
                }
            });
        }
    } catch(e) {
        console.error('[Followup Worker Error]', e);
    }
}

// Run every 1 minute
let followupInterval: ReturnType<typeof setInterval>;

export function startFollowupWorker() {
  followupInterval = setInterval(async () => {
    const { acquireLock } = await import('../system/locks.js');
    const locked = await acquireLock('cron_followup', 45000); // 45s lock
    if (locked) {
       await processFollowups();
    }
  }, 60000);
}

export function stopFollowupWorker() {
  if (followupInterval) clearInterval(followupInterval);
}


async function generateFollowUpText(f: any) {
  const profile = await getUserProfile(f.user_id);

  if (f.step === 0) {
    if (profile.negotiationStyle === 'aggressive') {
        return "Если честно, ниже уже некуда, это финал 🙏. Будешь оформлять?";
    }
    return "Слушай, тебе вообще актуально ещё? 👀";
  }

  if (f.step === 1) {
    if (profile.trustScore > 0.7) {
        return "Могу для тебя придержать партию, если что 🤝";
    }
    return "Могу чуть подвинуться по цене, если быстро решишь 🤝";
  }

  if (f.step === 2) {
    const scarcity = [
        "Осталось 2 штуки",
        "Сегодня забирают",
        "Партия почти закончилась"
    ];
    const randomScarce = scarcity[Math.floor(Math.random() * scarcity.length)];
    return `${randomScarce}, дальше не будет. Ждать не смогу 🙏`;
  }
  
  return null;
}
