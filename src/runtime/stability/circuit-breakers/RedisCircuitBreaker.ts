export class RedisCircuitBreaker {
  private static failures = 0;
  private static openedAt?: number;
  private static readonly MAX_FAILURES = 3;
  private static readonly RESET_TIMEOUT = 10000;

  static async execute<T>(fn: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (this.openedAt && Date.now() - this.openedAt < this.RESET_TIMEOUT) {
      return fallback();
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
      return fallback();
    }
  }
}
