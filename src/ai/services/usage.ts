import { db } from '../../db.js';

export const PLANS = {
  free: {
    messages: 100,
    leads: 20
  },
  pro: {
    messages: 2000,
    leads: 500
  },
  scale: {
    messages: 10000,
    leads: 5000
  }
};

export async function getUsage(workspaceId: string) {
  if (!workspaceId) return { messages: 0, leads: 0 };
  
  try {
    const dates = "created_at > (NOW() - INTERVAL '30 days')"; // typical monthly cycle

    const msgsRes = await db.query(`
      SELECT COUNT(*) as cnt 
      FROM sales_metrics 
      WHERE workspace_id = $1 AND event = 'ai_reply' AND ${dates}
    `, [workspaceId]);

    const leadsRes = await db.query(`
      SELECT COUNT(*) as cnt 
      FROM leads
      WHERE workspace_id = $1 AND ${dates}
    `, [workspaceId]);

    return {
      messages: Number(msgsRes.rows[0]?.cnt || 0),
      leads: Number(leadsRes.rows[0]?.cnt || 0)
    };
  } catch(e) {
    console.error('Failed to get usage', e);
    return { messages: 0, leads: 0 };
  }
}

export async function getUserPlan(workspaceId: string): Promise<keyof typeof PLANS> {
  try {
      const res = await db.query(`
        SELECT plan FROM saas_users u
        JOIN workspaces w ON w.owner_id = u.id
        WHERE w.id = $1
      `, [workspaceId]);

      const planStr = res.rows[0]?.plan as keyof typeof PLANS;
      return PLANS[planStr] ? planStr : 'free';
  } catch(e) {
      return 'free';
  }
}
