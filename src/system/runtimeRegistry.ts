export type HealthState = 'ok' | 'degraded' | 'critical' | 'starting' | 'stopped';

export interface RuntimeModule {
  name: string;
  start(): Promise<void>;
  stop(): Promise<void>;
  health(): Promise<HealthState>;
}

interface ModuleEntry {
  module: RuntimeModule;
  state: HealthState;
  restartCount: number;
  lastBootTime: number;
}

export class RuntimeRegistry {
  private modules = new Map<string, ModuleEntry>();

  register(mod: RuntimeModule) {
    this.modules.set(mod.name, {
      module: mod,
      state: 'stopped',
      restartCount: 0,
      lastBootTime: 0
    });
  }

  async startAll() {
    for (const [name, entry] of this.modules) {
      try {
        console.log(`[BOOT] Starting ${name}...`);
        entry.state = 'starting';
        entry.lastBootTime = Date.now();
        await entry.module.start();
        entry.state = 'ok';
      } catch (err) {
        console.error(`[BOOT] Failed to start ${name}:`, err);
        entry.state = 'critical';
      }
    }
  }

  async stopAll() {
    for (const [name, entry] of this.modules) {
      if (entry.state !== 'stopped') {
        try {
          console.log(`[SHUTDOWN] Stopping ${name}...`);
          await entry.module.stop();
          entry.state = 'stopped';
        } catch (err) {
          console.error(`[SHUTDOWN] Error stopping ${name}:`, err);
        }
      }
    }
  }

  async checkHealth(): Promise<Record<string, HealthState>> {
    const status: Record<string, HealthState> = {};
    for (const [name, entry] of this.modules) {
      try {
        if (entry.state !== 'stopped' && entry.state !== 'starting') {
          entry.state = await entry.module.health();
        }
        status[name] = entry.state;
      } catch (err) {
        console.error(`[HEALTH] Health check failed for ${name}:`, err);
        entry.state = 'critical';
        status[name] = 'critical';
      }
    }
    return status;
  }
}

export const registry = new RuntimeRegistry();
