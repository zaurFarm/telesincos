// STAGE 38 - Deterministic Frontend Runtime

export interface CognitiveAction {
    type: string;
    payload?: any;
    meta?: {
        timestamp: number;
        source: 'local' | 'remote';
        causal_chain_id?: string;
    };
}

export interface CognitiveState {
    marketIntent: number;
    activeDeals: number;
    riskScore: number;
    systemHealth: 'NORMAL' | 'DEGRADED' | 'CRITICAL';
    driftDetected: boolean;
    lastSyncTimestamp: number;
}

const initialState: CognitiveState = {
    marketIntent: 0,
    activeDeals: 0,
    riskScore: 0,
    systemHealth: 'NORMAL',
    driftDetected: false,
    lastSyncTimestamp: Date.now()
};

export const cognitiveReducer = (state: CognitiveState = initialState, action: CognitiveAction): CognitiveState => {
    switch (action.type) {
        case 'SYNC_STATE':
            return {
                ...state,
                ...action.payload,
                lastSyncTimestamp: action.meta?.timestamp || Date.now()
            };
        case 'RISK_UPDATED':
            return {
                ...state,
                riskScore: action.payload.score
            };
        case 'HEALTH_DEGRADED':
            return {
                ...state,
                systemHealth: 'DEGRADED'
            };
        case 'DRIFT_DETECTED':
            return {
                ...state,
                driftDetected: true
            };
        default:
            return state;
    }
};

// Simple Redux-like store
class CognitiveStoreImpl {
    private state: CognitiveState;
    private listeners: Set<() => void> = new Set();

    constructor() {
        this.state = initialState;
    }

    getState() {
        return this.state;
    }

    dispatch(action: CognitiveAction) {
        this.state = cognitiveReducer(this.state, action);
        this.listeners.forEach(listener => listener());
    }

    subscribe(listener: () => void) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }
}

export const CognitiveStore = new CognitiveStoreImpl();
