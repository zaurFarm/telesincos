export enum DegradationState {
  FULL_CAPACITY = 'FULL_CAPACITY',
  RESTRICTED_HORIZON = 'RESTRICTED_HORIZON',
  CORE_CONTINUITY_ONLY = 'CORE_CONTINUITY_ONLY',
  HIBERNATION = 'HIBERNATION'
}

export class GracefulDegradationModes {
  private currentState: DegradationState = DegradationState.FULL_CAPACITY;

  public transitionState(entropyScore: number): DegradationState {
    if (entropyScore > 90) {
      this.currentState = DegradationState.HIBERNATION;
    } else if (entropyScore > 75) {
      this.currentState = DegradationState.CORE_CONTINUITY_ONLY;
    } else if (entropyScore > 50) {
      this.currentState = DegradationState.RESTRICTED_HORIZON;
    } else {
      this.currentState = DegradationState.FULL_CAPACITY;
    }
    
    console.log(`[DEGRADATION MODES] Transitioned to ${this.currentState} due to entropy score ${entropyScore}.`);
    return this.currentState;
  }

  public getCurrentState(): DegradationState {
    return this.currentState;
  }
}
