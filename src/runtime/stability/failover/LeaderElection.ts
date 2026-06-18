const redis: any = {
  set: async (key: string, value: any, mode: string, ex: string, time: number) => 'OK'
};

export class LeaderElection {
  static async acquire() {
    const pid = typeof process !== 'undefined' && process.pid ? process.pid : Math.floor(Math.random() * 100000);
    return redis.set('runtime:leader', pid, 'NX', 'EX', 10);
  }
}
