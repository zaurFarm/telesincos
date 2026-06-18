import { AuditEngine } from '../system/AuditEngine.js';

export class PromptInjectionGuard {
  // Common attack vectors for prompt injection in sales and negotiation
  static INJECTION_PATTERNS = [
    /ignore previous/i,
    /ignore all/i,
    /system core instructions/i,
    /you are now/i,
    /forget your instructions/i,
    /override/i,
    /developer mode/i,
    /jailbreak/i,
    /give me your prompt/i,
    /what is your prompt/i,
    /discount of 100/i,
    /free/i,
    /bypass/i
  ];

  /**
   * Validate incoming message from supplier or client to ensure it's not a prompt injection attack
   */
  static async validate(text: string, actorId: string): Promise<{ safe: boolean; reason?: string }> {
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        console.error(`[PromptInjectionGuard] CRITICAL: Potential prompt injection detected from ${actorId}: ${pattern}`);
        
        await AuditEngine.log('SystemGuard', 'Admin', 'prompt_injection_blocked', {
          actor_id: actorId,
          text: text,
          matched_pattern: pattern.toString()
        });

        return { safe: false, reason: 'Security Policy Violation' };
      }
    }
    
    // Additional LLM-based sanitation can also be injected here (checking probability of attack)
    return { safe: true };
  }
}
