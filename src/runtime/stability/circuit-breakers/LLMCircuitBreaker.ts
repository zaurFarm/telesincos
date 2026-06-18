export class LLMCircuitBreaker {
  private static failures = 0;
  private static openedAt?: number;

  private static readonly MAX_FAILURES = 5;
  private static readonly RESET_TIMEOUT = 30000;

  static async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.openedAt && Date.now() - this.openedAt < this.RESET_TIMEOUT) {
      throw new Error('LLM circuit open');
    }

    try {
      const result = await fn();
      this.failures = 0;
      this.openedAt = undefined;
      return result;
    } catch (e) {
      this.failures++;
      if (this.failures >= this.MAX_FAILURES) {
        this.openedAt = Date.now();
      }
      throw e;
    }
  }
}
