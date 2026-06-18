// STAGE 26 - Multi-Agent Strategic Mesh

export interface AgentCapability {
  name: string;
  canRead: string[];
  canWrite: string[];
  canExecute: string[];
  requiresApprovalFor: string[];
}

export const AGENT_REGISTRY: Record<string, AgentCapability> = {
  'NegotiatorAgent': {
    name: 'NegotiatorAgent',
    canRead: ['chat_history', 'market_prices'],
    canWrite: ['draft_offers'],
    canExecute: ['send_message', 'request_discount'],
    requiresApprovalFor: ['apply_discount_above_10_percent']
  },
  'RiskAgent': {
    name: 'RiskAgent',
    canRead: ['all_streams', 'user_profile', 'transaction_history'],
    canWrite: ['risk_scores', 'fraud_alerts'],
    canExecute: ['block_transaction', 'flag_user'],
    requiresApprovalFor: ['permanent_ban']
  },
  'MarketAgent': {
    name: 'MarketAgent',
    canRead: ['competitor_prices', 'market_trends'],
    canWrite: ['dynamic_prices'],
    canExecute: ['update_price_strategy'],
    requiresApprovalFor: ['price_drop_below_margin']
  },
  'PublishingAgent': {
    name: 'PublishingAgent',
    canRead: ['approved_content', 'publishing_queue'],
    canWrite: ['publish_reputation'],
    canExecute: ['dispatch_post', 'schedule_post'],
    requiresApprovalFor: ['high_risk_publish']
  }
};

export class AgentMeshRouter {
    static checkPermission(agentName: string, actionType: 'read' | 'write' | 'execute', resource: string): boolean {
        const agent = AGENT_REGISTRY[agentName];
        if (!agent) {
           console.error(`[SECURITY] Agent ${agentName} is not registered. Access denied to ${actionType} ${resource}.`);
           return false;
        }

        switch (actionType) {
            case 'read': return agent.canRead.includes(resource) || agent.canRead.includes('all_streams');
            case 'write': return agent.canWrite.includes(resource);
            case 'execute': return agent.canExecute.includes(resource);
            default: return false;
        }
    }

    static requiresHumanOverride(agentName: string, action: string): boolean {
         const agent = AGENT_REGISTRY[agentName];
         if (!agent) return true; // Default deny
         return agent.requiresApprovalFor.includes(action);
    }
}

export class MeshExecutionGate {
  static async executeAction(agentName: string, actionName: string, payload: any, executor: () => Promise<any>): Promise<any> {
    const isAllowed = AgentMeshRouter.checkPermission(agentName, 'execute', actionName);
    
    if (!isAllowed) {
      throw new Error(`[CAPABILITY DENIED] Agent '${agentName}' does not have capability to execute '${actionName}'.`);
    }

    const needsApproval = AgentMeshRouter.requiresHumanOverride(agentName, actionName);
    if (needsApproval) {
      // Return a pending state or throw RequiresApprovalError depending on system design
      throw new Error(`[APPROVAL REQUIRED] Action '${actionName}' by '${agentName}' requires human override.`);
    }

    console.log(`[MESH GATE] Authorizing execution of '${actionName}' by '${agentName}'...`);
    try {
      return await executor();
    } catch (e) {
      console.error(`[MESH GATE] Execution failure for '${actionName}' by '${agentName}':`, e);
      throw e;
    }
  }
}
