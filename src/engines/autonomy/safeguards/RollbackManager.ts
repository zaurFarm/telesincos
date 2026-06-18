export class RollbackManager {
  static rollback(policyId: string) {
    console.warn(`Rollback triggered for ${policyId}`);
    // restore previous snapshot
  }
}
