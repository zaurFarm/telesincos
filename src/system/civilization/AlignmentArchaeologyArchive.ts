export interface AlignmentArtifact {
  id: string;
  originalDirective: string;
  failureModeObserved: string;
  hardLimitImplemented: string;
  epochRecorded: number;
}

export class AlignmentArchaeologyArchive {
  private artifacts: AlignmentArtifact[] = [];

  public recordHistoricalFailure(
    directive: string, 
    failure: string, 
    limit: string, 
    epoch: number
  ): void {
    const artifact: AlignmentArtifact = {
      id: `fail-${Date.now()}`,
      originalDirective: directive,
      failureModeObserved: failure,
      hardLimitImplemented: limit,
      epochRecorded: epoch,
    };
    this.artifacts.push(artifact);
    console.log(`[ARCHAEOLOGY] Recorded artifact ${artifact.id} preserving failure knowledge.`);
  }

  public retrieveArtifacts(): AlignmentArtifact[] {
    return this.artifacts;
  }
}
