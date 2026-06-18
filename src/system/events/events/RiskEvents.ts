export const RISK_EVENTS = {
    ALERT: 'RISK_ALERT',
    FRAUD_DETECTED: 'RISK_FRAUD_DETECTED'
} as const;

export interface RiskAlertPayload {
    dealId: string;
    clientId: string;
    riskScore: number;
    reason: string;
    timestamp: number;
}
