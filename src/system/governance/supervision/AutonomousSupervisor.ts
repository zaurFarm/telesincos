import { AIEventBus } from '../../events/AIEventBus.js';

export class AutonomousSupervisor {
  static inspect(agentState: any) {
    if (agentState.errorRate > 0.3) {
      AIEventBus.emit('AGENT_DEGRADED', { agent: agentState.name });
    }
  }
}
