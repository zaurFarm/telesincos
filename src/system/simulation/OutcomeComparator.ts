export class OutcomeComparator {
    static compare(originalOutcome: any, simulatedOutcome: any) {
        return {
            diff: {}, // compute diff between outcomes
            isBetter: true, // evaluation heuristic 
            riskDelta: 0
        };
    }
}
