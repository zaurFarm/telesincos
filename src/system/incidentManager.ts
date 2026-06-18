import { db } from '../db.js';
import { logger } from './logger.js';

export async function createIncident(data: {
  root_cause: string;
  confidence: number;
  slo_impact: number;
  regions_affected?: string[];
  suggested_actions?: Array<{
    action_type: string;
    description: string;
    risk_level: 'low' | 'medium' | 'high';
    confidence: number;
  }>;
}) {
  const { root_cause, confidence, slo_impact, regions_affected = ['ALL'] } = data;
  
  try {
    const res = await db.query(`
      INSERT INTO incidents (root_cause, confidence, slo_impact, regions_affected)
      VALUES ($1, $2, $3, $4) RETURNING id
    `, [root_cause, confidence, slo_impact, JSON.stringify(regions_affected)]);
    
    const incidentId = res.rows[0].id;
    
    if (data.suggested_actions && data.suggested_actions.length > 0) {
      for (const action of data.suggested_actions) {
        await db.query(`
          INSERT INTO incident_actions (incident_id, action_type, description, risk_level, confidence)
          VALUES ($1, $2, $3, $4, $5)
        `, [incidentId, action.action_type, action.description, action.risk_level, action.confidence]);
      }
    }
    
    logger.error({ 
      type: 'system', 
      message: `New Incident Created: ${root_cause} (Impact: ${slo_impact}%)` 
    });
    
    return incidentId;
  } catch (e: any) {
    console.error('Failed to create incident:', e.message);
  }
}

export async function executeAction(actionId: number, executorId: string) {
  try {
    const actionRes = await db.query('SELECT * FROM incident_actions WHERE id = $1', [actionId]);
    if (!actionRes.rows.length) return false;
    
    const action = actionRes.rows[0];
    if (action.status !== 'approved') return false;
    
    // Simulate execution context
    logger.info({ type: 'system', message: `Executing Incident Action: ${action.action_type}` });
    
    await db.query(`
      UPDATE incident_actions 
      SET status = 'executed', executed_at = NOW() 
      WHERE id = $1
    `, [actionId]);
    
    await db.query(`
      INSERT INTO action_logs (action_id, incident_id, action_name, executed_by)
      VALUES ($1, $2, $3, $4)
    `, [actionId, action.incident_id, action.action_type, executorId]);
    
    return true;
  } catch(e: any) {
    logger.error({ type: 'system', message: `Execution failed: ${e.message}` });
    return false;
  }
}
