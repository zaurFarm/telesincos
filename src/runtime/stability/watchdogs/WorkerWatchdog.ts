export class WorkerWatchdog {
  static isAlive(heartbeat: number) {
    return Date.now() - heartbeat < 30000;
  }
}
