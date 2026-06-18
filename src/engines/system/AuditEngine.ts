import { getDb } from '../../db.js';

export type Role = 'Owner' | 'Admin' | 'Manager' | 'Procurement' | 'Supplier' | 'AIAgent' | 'Viewer';

export class AuditEngine {
  /**
   * Log any critical AI or User action
   */
  static async log(actor: string, role: Role, action: string, details: any): Promise<void> {
    const db = await getDb();
    const payload = JSON.stringify(details);
    
    // Write entry to audit_logs
    await db.run(
      `INSERT INTO audit_logs (entity, action, ai_decision, old_value, new_value) VALUES ($1, $2, $3, $4, $5)`,
      [actor, `${role}:${action}`, details.reason || null, JSON.stringify(details.old_value || null), JSON.stringify(details.new_value || null)]
    );
    
    console.log(`[AuditLog] [${role}] ${actor} executed ${action}:`, details);
  }

  /**
   * Check permissions based on RBAC schema
   */
  static checkPermission(role: Role, action: string): boolean {
    const permissions: Record<Role, string[]> = {
      Owner: ['*'],
      Admin: ['*'],
      Manager: ['approve_drafts', 'change_price_manual', 'view_all'],
      Procurement: ['negotiate_supplier', 'invite_supplier', 'view_orders'],
      Supplier: ['update_stock', 'view_own_orders', 'chat_with_agent'],
      AIAgent: ['draft_product', 'negotiate_supplier', 'monitor_prices', 'create_order_auto'],
      Viewer: ['view_dashboard']
    };

    if (permissions[role]?.includes('*')) return true;
    return permissions[role]?.includes(action) || false;
  }
}
