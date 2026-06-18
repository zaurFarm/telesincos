export class StrategyRollback {
  static rollback(version: string) {
    console.warn(`Restoring policy snapshot ${version}`);
  }
}
