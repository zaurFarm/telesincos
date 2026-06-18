export class EventLoopWatchdog {
  static async detectLag() {
    const start = performance.now();
    await new Promise(r => setTimeout(r, 0));
    return performance.now() - start;
  }
}
