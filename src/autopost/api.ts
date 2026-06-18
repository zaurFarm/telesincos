import { db } from '../db.js';
import { getSettings } from '../system/settings.js';

export async function getPendingPosts(req: any, res: any) {
  try {
    const result = await db.query("SELECT * FROM pending_autoposts WHERE status = 'pending' ORDER BY created_at DESC");
    res.json({ success: true, posts: result.rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function approvePost(req: any, res: any) {
  try {
    const { id } = req.params;
    const { proposed_text } = req.body;
    await db.query("UPDATE pending_autoposts SET status = 'approved', proposed_text = $1 WHERE id = $2", [proposed_text, id]);
    // Would typically send it directly here or pick it up in a worker
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function rejectPost(req: any, res: any) {
  try {
    const { id } = req.params;
    await db.query("UPDATE pending_autoposts SET status = 'rejected' WHERE id = $1", [id]);
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}

export async function getHistory(req: any, res: any) {
  try {
    const result = await db.query("SELECT * FROM pending_autoposts ORDER BY created_at DESC LIMIT 50");
    res.json({ success: true, history: result.rows });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
