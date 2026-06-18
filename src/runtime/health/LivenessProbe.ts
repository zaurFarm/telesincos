export class LivenessProbe {
  static check() {
    const mem = process.memoryUsage();
    return {
      status: 'alive',
      uptime: process.uptime(),
      memory: {
        rss: mem.rss,
        heapTotal: mem.heapTotal,
        heapUsed: mem.heapUsed,
      }
    };
  }
}
