import { logAction, saveConversation } from '../../server.js';
import { db as pool } from '../db.js';
import { getClient } from './userbot.js';
import { getRetargetMessage, getUpsellMessage } from '../ai/retarget.js';
import { detectClientType } from '../ai/classifier.js';
import { humanizeText } from '../antiban/humanize.js';
import { getRandomDelay, sleep } from '../antiban/delay.js';
import { canSendMessage, incrementMessageCount } from '../antiban/limits.js';

export async function processRetargeting() {
  let client;
  try {
    client = getClient();
  } catch (e) {
    return; // Ignore if not running in userbot mode
  }
  if (!client || !client.connected) return;

  try {
    const workspacesRes = await pool.query(`SELECT id::text FROM workspaces`);
    
    for (const workspace of workspacesRes.rows) {
      await pool.withTenant(workspace.id, async (clientPool) => {
        // 1. Retargeting (Leads in 'dialog' status for > 24h)
        const retargetLeads = await clientPool.query(`
          SELECT * FROM leads
          WHERE status = 'dialog'
          AND updated_at < NOW() - INTERVAL '24 hours'
          AND updated_at > NOW() - INTERVAL '72 hours'
        `);

        for (const lead of retargetLeads.rows) {
          if (!(await canSendMessage())) break;

          const daysPassed = Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / (1000 * 60 * 60 * 24));
          
          // Get last user message to detect type
          const lastMsgRes = await clientPool.query(`
            SELECT message FROM conversations
            WHERE lead_id = $1 AND role = 'user'
            ORDER BY id DESC LIMIT 1
          `, [lead.id]);

          const lastMsg = lastMsgRes.rows && lastMsgRes.rows.length > 0 ? (lastMsgRes.rows[0].message || '') : '';
          const clientType = detectClientType(lastMsg);

          const reply = getRetargetMessage(clientType, daysPassed);

          if (reply) {
            const finalReply = humanizeText(reply);
            await sleep(getRandomDelay());

            try {
              await client.sendMessage(lead.source_chat, { message: finalReply });
              incrementMessageCount();
              await saveConversation(lead.user_id, lead.source_chat, 'assistant', finalReply, lead.id);
              
              // Update lead to prevent spamming
              await clientPool.query(`UPDATE leads SET updated_at = NOW() WHERE id = $1`, [lead.id]);
              
              await logAction({
                type: 'retarget',
                user: lead.username || lead.user_id,
                chat: lead.source_chat,
                content: finalReply,
                reason: `Retargeting after ${daysPassed} days`
              });
            } catch (e) {
              console.error("Failed to send retarget message", e);
            }
          }
        }

        // 2. Upselling (Leads in 'closed' status for > 24h)
        const upsellLeads = await clientPool.query(`
          SELECT * FROM leads
          WHERE status = 'closed'
          AND updated_at < NOW() - INTERVAL '24 hours'
          AND updated_at > NOW() - INTERVAL '48 hours'
        `);

        for (const lead of upsellLeads.rows) {
          if (!(await canSendMessage())) break;

          // Get last user message to detect type
          const lastMsgRes = await clientPool.query(`
            SELECT message FROM conversations
            WHERE lead_id = $1 AND role = 'user'
            ORDER BY id DESC LIMIT 1
          `, [lead.id]);

          const lastMsg = lastMsgRes.rows && lastMsgRes.rows.length > 0 ? (lastMsgRes.rows[0].message || '') : '';
          const clientType = detectClientType(lastMsg);

          const reply = getUpsellMessage(clientType);

          if (reply) {
            const finalReply = humanizeText(reply);
            await sleep(getRandomDelay());

            try {
              await client.sendMessage(lead.source_chat, { message: finalReply });
              incrementMessageCount();
              await saveConversation(lead.user_id, lead.source_chat, 'assistant', finalReply, lead.id);
              
              // Update lead to prevent spamming
              await clientPool.query(`UPDATE leads SET updated_at = NOW() WHERE id = $1`, [lead.id]);
              
              await logAction({
                type: 'upsell',
                user: lead.username || lead.user_id,
                chat: lead.source_chat,
                content: finalReply,
                reason: `Upselling after purchase`
              });
            } catch (e) {
              console.error("Failed to send upsell message", e);
            }
          }
        }
      });
    }

  } catch (e) {
    console.error("Error in processRetargeting", e);
  }
}
