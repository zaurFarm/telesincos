export class AIToolPermissions {
  /**
   * Enterprise Safety: Strict Whitelist for AI Agents.
   * AI Agents must never be allowed to perform destructive or high-financial-risk actions autonomously.
   */
  static ENFORCED_WHITELIST = [
    'draft_product',
    'negotiate_supplier',
    'monitor_prices',
    'create_order_auto', // Subject to idempotency and Margin limits
    'check_stock',
    'send_message'
  ];

  static ENFORCED_BLACKLIST = [
    'delete_product',
    'delete_order',
    'delete_supplier',
    'refund_money',
    'change_bank_details',
    'grant_permissions'
  ];

  static canExecuteTool(toolName: string): boolean {
    if (this.ENFORCED_BLACKLIST.includes(toolName)) {
      console.error(`[AIToolPermissions] CRITICAL: AI attempted blocked action: ${toolName}`);
      return false; // Hardware-level hardcoded firewall
    }

    if (!this.ENFORCED_WHITELIST.includes(toolName)) {
      console.warn(`[AIToolPermissions] AI attempted unknown action: ${toolName}. Blocking by default.`);
      return false;
    }

    return true;
  }
}
