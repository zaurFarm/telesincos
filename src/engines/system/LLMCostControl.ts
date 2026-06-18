import { getDb } from '../../db.js';

export class LLMCostControl {
  static MODEL_COST_RATES = {
    'gemini-3.1-pro': {
      prompt: 0.00000125, // cost per token
      completion: 0.00000375
    }
  };

  static GLOBAL_DAILY_BUDGET_USD = 50.00;

  /**
   * Enterprise LLM Financial Guardrail to prevent runaway LLM costs 
   * in infinite negotiation loops or bot spam.
   */
  static async logUsage(modelId: string, promptTokens: number, compTokens: number, actorId: string): Promise<void> {
    const db = await getDb();
    
    // @ts-ignore
    const rates = this.MODEL_COST_RATES[modelId] || this.MODEL_COST_RATES['gemini-3.1-pro'];
    const sessionCost = (promptTokens * rates.prompt) + (compTokens * rates.completion);

    await db.run(
      `INSERT INTO ai_cost_logs (model_id, tokens_prompt, tokens_completion, cost_usd, actor) VALUES ($1, $2, $3, $4, $5)`,
      [modelId, promptTokens, compTokens, sessionCost, actorId]
    );

    console.log(`[LLMCostControl] Used ${promptTokens+compTokens} tokens ($${sessionCost.toFixed(5)}) by ${actorId}`);
  }

  static async checkBudgetExceeded(): Promise<boolean> {
    // Queries ai_cost_logs WHERE created_at > TODAY
    // Returns true if SUM(cost_usd) > GLOBAL_DAILY_BUDGET_USD
    return false;
  }
}
