import { db as pool } from '../db.js';
import { getClient } from './clientPool.js';
import { getWarmupStage } from './warmupStage.js';
import { getLimitsByStage } from './warmupBehavior.js';
import { Api } from 'telegram';

async function simulateReading(client: any) {
  try {
    const dialogs = await client.getDialogs({ limit: 10 });
    // Randomly pick a few to "read"
    for (const dialog of dialogs) {
      if (Math.random() > 0.5) {
         // Mark as read
         await client.invoke(new Api.messages.ReadHistory({ peer: dialog.entity, maxId: 0 }));
         await new Promise(res => setTimeout(res, 2000 + Math.random() * 4000));
      }
    }
  } catch {}
}

async function simulateReactions(client: any) {
  try {
    const dialogs = await client.getDialogs({ limit: 5 });

    for (const dialog of dialogs) {
      if (Math.random() > 0.7 && dialog.isGroup) {
         // Fake reading group logic
         await new Promise(res => setTimeout(res, 5000));
      }
    }
  } catch {}
}

const warmupTexts = [
  "понял",
  "ок",
  "спасибо",
  "ясно",
  "норм",
  "привет!",
  "ага",
  "хорошо"
];

async function simulateMessages(client: any, limit: number) {
  for (let i = 0; i < limit; i++) {
    const text = warmupTexts[Math.floor(Math.random() * warmupTexts.length)];

    try {
      // typing simulator
      await client.invoke(new Api.messages.SetTyping({
            peer: "me",
            action: new Api.SendMessageTypingAction()
      }));
      await new Promise(res => setTimeout(res, text.length * 100));

      await client.sendMessage("me", { message: text });
    } catch {}

    await new Promise(res => setTimeout(res, 10000 + Math.random() * 20000));
  }
}

async function simulateOnline(client: any) {
  // Update status
  try {
      await client.invoke(new Api.account.UpdateStatus({ offline: false }));
      await new Promise(res => setTimeout(res, 5000 + Math.random() * 10000));
  } catch(e: any) { console.debug("[warmup] status update failed:", e?.message); }
}

export async function runWarmupCycle() {
  try {
      const workspacesRes = await pool.query(`SELECT id::text FROM workspaces`);
      
      for (const workspace of workspacesRes.rows) {
        await pool.withTenant(workspace.id, async (clientPool) => {
          const res = await clientPool.query(`SELECT * FROM farm_accounts WHERE status='warmup' OR status='active'`);

          for (const acc of res.rows) {
            const stage = getWarmupStage(acc.created_at);
            const limits = getLimitsByStage(stage);

            try {
                const client = await getClient(acc);

                // 1. Онлайн имитация
                await simulateOnline(client);

                // 2. Просмотр чатов
                await simulateReading(client);

                // 3. Реакции
                if (stage >= 2) {
                  await simulateReactions(client);
                }

                // 4. Сообщения
                if (stage >= 3) {
                  await simulateMessages(client, Math.min(limits.messages, 3)); // just 3 msgs max for warmup to saved messages
                }

                // Upgrade status if warmed up
                if (stage >= 4 && acc.status === 'warmup') {
                    await clientPool.query(`UPDATE farm_accounts SET status = 'active', daily_limit = 30, warmup_stage = 4 WHERE id = $1`, [acc.id]);
                    console.log(`🚀 Account ${acc.id} successfully passed warmup and is now ACTIVE`);
                } else {
                    await clientPool.query(`UPDATE farm_accounts SET warmup_stage = $1 WHERE id = $2`, [stage, acc.id]);
                    console.log(`🍵 Account ${acc.id} warmed up (Stage ${stage})`);
                }
            } catch(err) {
                console.error(`[Warmup] Failed for account ${acc.id}`);
            }
          }
        });
      }
  } catch(e) {
      console.error("Warmup cycle error", e);
  }
}