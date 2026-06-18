export class CooldownManager {
  private activeCooldowns: Map<string, number> = new Map();

  setCooldown(key: string, durationMs: number) {
    this.activeCooldowns.set(key, Date.now() + durationMs);
  }

  isOnCooldown(key: string): boolean {
    const expiry = this.activeCooldowns.get(key);
    if (!expiry) return false;
    return Date.now() < expiry;
  }

  tick() {
    const now = Date.now();
    for (const [key, expiry] of this.activeCooldowns.entries()) {
      if (now > expiry) {
        this.activeCooldowns.delete(key);
      }
    }
  }
}

export const GlobalCooldownManager = new CooldownManager();
