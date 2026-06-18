export class CircuitBreaker {
  private failures = 0;
  private lastFail = 0;

  constructor(
    private threshold = 5,
    private resetTime = 30000
  ) {}

  async exec(fn: Function) {
    const now = Date.now();

    if (this.failures >= this.threshold) {
      if (now - this.lastFail < this.resetTime) {
        throw new Error('Circuit OPEN');
      }
      this.failures = 0;
    }

    try {
      return await fn();
    } catch (e) {
      this.failures++;
      this.lastFail = now;
      throw e;
    }
  }
}
