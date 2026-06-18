import { logger } from './logger.js';
import { db } from '../db.js';
import { getCurrentStrategy, switchStrategy, evaluateStrategy } from './strategyEngine.js';
import { emitEvent } from './events.js';

export interface SystemSnapshot {
  id: string;
  timestamp: number;
  strategyId: string;
  workerScale: number;
  isFarmPaused: boolean;
  reason: string;
  tenantId: string;
}

// Hard RBAC matrix
export const ROLE_PERMISSIONS = {
  viewer: ['read_state'],
  operator: ['read_state', 'trigger_failsafe', 'pause_farm', 'resume_farm', 'create_snapshot'],
  admin: ['read_state', 'scale_workers', 'set_strategy', 'trigger_failsafe', 'pause_farm', 'resume_farm', 'create_snapshot', 'rollback']
};

export function hasPermission(role: string, action: string) {
  const perms = (ROLE_PERMISSIONS as any)[role] || [];
  return perms.includes(action);
}

class SystemOrchestrator {
  // In a real SaaS, these would be in the database per-tenant.
  // Using memory maps keyed by tenantId for demo simplicity.
  private isFarmPaused: Record<string, boolean> = {};
  private workerScale: Record<string, number> = {};
  private snapshots: Record<string, SystemSnapshot[]> = {};
  private failSafeActive: Record<string, boolean> = {};

  private checkPermission(tenantId: string, role: string, action: string) {
    if (!hasPermission(role, action)) {
      emitEvent('permission_denied', { tenantId, role, action });
      throw new Error(`Access Denied: ${role} cannot perform ${action}`);
    }
  }

  async getState(tenantId: string, role: string) {
    this.checkPermission(tenantId, role, 'read_state');
    
    // Collect stats from DB - tenant isolated!
    // Assume leads and logs are tenant-isolated if workspace_id existed, for now mock WHERE 1=1 is enough since we only show logic
    const bgTaskRes = await db.query(`
      SELECT 'accounts' as type, count(*) as c FROM farm_accounts
      UNION ALL
      SELECT 'leads', count(*) FROM leads
      UNION ALL
      SELECT 'errors', count(*) FROM system_logs WHERE level = 'error' AND created_at > NOW() - INTERVAL '1 hour'
    `);
    
    const incidents = await db.query(`
      SELECT * FROM incidents WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 5
    `);

    const stats = bgTaskRes.rows.reduce((acc: any, row: any) => {
      acc[row.type] = parseInt(row.c);
      return acc;
    }, {});

    return {
      tenantId,
      farm: {
        totalAccounts: stats.accounts || 0,
        isPaused: this.isFarmPaused[tenantId] || false
      },
      ai: {
        activeWorkers: this.workerScale[tenantId] || 1,
      },
      strategy: {
        current: getCurrentStrategy().id,
        config: getCurrentStrategy()
      },
      metrics: {
        recentErrors: stats.errors || 0,
        totalLeads: stats.leads || 0,
        cpu: process.cpuUsage().user / 1000000, 
        ram: process.memoryUsage().heapUsed / 1024 / 1024
      },
      stability: {
        isFailSafe: this.failSafeActive[tenantId] || false,
        snapshots: this.snapshots[tenantId] || []
      },
      incidents: incidents.rows
    };
  }

  async scaleWorkers(tenantId: string, role: string, scale: number) {
    this.checkPermission(tenantId, role, 'scale_workers');
    if (scale < 1) scale = 1;
    if (scale > 20) scale = 20;
    this.workerScale[tenantId] = scale;
    await emitEvent('orchestrator_scale', { tenantId, newScale: scale, userRole: role });
  }

  async pauseFarm(tenantId: string, role: string) {
    this.checkPermission(tenantId, role, 'pause_farm');
    this.isFarmPaused[tenantId] = true;
    await emitEvent('orchestrator_pause_farm', { tenantId, userRole: role });
    await db.query(`UPDATE farm_accounts SET status = 'PAUSED' WHERE status IN ('ACTIVE', 'WARMING_UP')`);
  }
  
  async resumeFarm(tenantId: string, role: string) {
    this.checkPermission(tenantId, role, 'resume_farm');
    this.isFarmPaused[tenantId] = false;
    this.failSafeActive[tenantId] = false;
    await emitEvent('orchestrator_resume_farm', { tenantId, userRole: role });
    await db.query(`UPDATE farm_accounts SET status = 'ACTIVE' WHERE status = 'PAUSED'`);
  }

  async setStrategy(tenantId: string, role: string, newStrategyId: string) {
    this.checkPermission(tenantId, role, 'set_strategy');
    switchStrategy(newStrategyId, 'manual_ui');
    await emitEvent('orchestrator_strategy_changed', { tenantId, strategy: newStrategyId, userRole: role });
  }

  // STABILITY LAYER: Snapshots & Rollback

  async createSnapshot(tenantId: string, role: string, reason: string = 'manual') {
    this.checkPermission(tenantId, role, 'create_snapshot');
    const s = await this.getState(tenantId, 'admin'); // Bypass state read permission for snapshot encoding
    const snapshot: SystemSnapshot = {
      id: Math.random().toString(36).substring(7),
      timestamp: Date.now(),
      strategyId: s.strategy.current,
      workerScale: s.ai.activeWorkers,
      isFarmPaused: s.farm.isPaused,
      reason,
      tenantId
    };
    if (!this.snapshots[tenantId]) this.snapshots[tenantId] = [];
    this.snapshots[tenantId].push(snapshot);
    if (this.snapshots[tenantId].length > 10) this.snapshots[tenantId].shift();
    
    await emitEvent('snapshot_created', { tenantId, snapshotId: snapshot.id, reason, userRole: role });
    return snapshot;
  }

  async rollbackTo(tenantId: string, role: string, snapshotId: string) {
    this.checkPermission(tenantId, role, 'rollback');
    const snaps = this.snapshots[tenantId] || [];
    const snapshot = snaps.find(s => s.id === snapshotId);
    if (!snapshot) throw new Error('Snapshot not found');

    await emitEvent('system_rollback_started', { tenantId, targetSnapshot: snapshotId, userRole: role });
    
    await this.setStrategy(tenantId, 'admin', snapshot.strategyId);
    await this.scaleWorkers(tenantId, 'admin', snapshot.workerScale);
    if (snapshot.isFarmPaused) {
      await this.pauseFarm(tenantId, 'admin');
    } else {
      await this.resumeFarm(tenantId, 'admin');
    }
    
    this.failSafeActive[tenantId] = false;
    await emitEvent('system_rollback_completed', { tenantId, targetSnapshot: snapshotId });
    return true;
  }

  async triggerFailSafe(tenantId: string, role: string, reason: string) {
    this.checkPermission(tenantId, role, 'trigger_failsafe');
    if (this.failSafeActive[tenantId]) return;
    
    await emitEvent('fail_safe_triggered', { tenantId, reason, userRole: role });
    this.failSafeActive[tenantId] = true;
    
    await this.createSnapshot(tenantId, 'admin', 'pre_failsafe');
    
    // Hard restrictions
    await this.setStrategy(tenantId, 'admin', 'safe');
    await this.scaleWorkers(tenantId, 'admin', 1);
    await this.pauseFarm(tenantId, 'admin');
  }

  async runPulse() {
    await evaluateStrategy();
    
    // For every active tenant, check anomaly rules
    const tenants = Object.keys(this.snapshots);
    // Auto Fail-Safe if errors spike crazily (simplified global check for now)
    try {
      const metricsRes = await db.query(`SELECT count(*) as errs FROM system_logs WHERE level = 'error' AND created_at > NOW() - INTERVAL '10 minutes'`);
      const errs = parseInt(metricsRes.rows[0]?.errs || '0');
      
      if (errs > 50) {
        // Trigger for default tenant 'tenant_1'
        if (!this.failSafeActive['tenant_1']) {
          await this.triggerFailSafe('tenant_1', 'admin', 'auto_error_spike_pulse');
        }
      }
    } catch (e: any) {
      if (e.code !== 'ECONNREFUSED' && !e.message?.includes('ECONNREFUSED')) {
        logger.error({ type: 'run_pulse_error', error: String(e) });
      }
    }
  }
}

export const orchestrator = new SystemOrchestrator();
