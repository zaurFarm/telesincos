export class MemoryWatchdog {
  static inspect() {
    if (typeof process === 'undefined' || !process.memoryUsage) {
      return true;
    }
    const heap = process.memoryUsage().heapUsed;
    return heap < 1024 * 1024 * 1024;
  }
}
