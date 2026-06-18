const SnapshotStore: any = { load: async (id: string) => null };
const RuntimeRecovery: any = { rebuildAggregate: async (id: string) => null };

export class SnapshotRepair {
  static async repair(aggregateId: string) {
    const snapshot = await SnapshotStore.load(aggregateId);
    if (!snapshot) {
      return RuntimeRecovery.rebuildAggregate(aggregateId);
    }
    return snapshot;
  }
}
