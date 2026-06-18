export interface DiscountRequest {
    originalPrice: number;
    requestedPrice: number;
    riskScore: number;
    trustScore: number;
    competitorPresent: boolean;
}

export class DiscountApprovalPolicy {
    static evaluate(request: DiscountRequest): { approved: boolean, requireManager?: boolean, reason: string } {
        const discountPercent = (request.originalPrice - request.requestedPrice) / request.originalPrice;

        if (discountPercent <= 0) {
            return { approved: true, reason: 'No discount' };
        }

        if (discountPercent > 0.20) {
            return { approved: false, requireManager: true, reason: 'Discount exceeds 20% hard limit' };
        }

        if (request.riskScore > 70) {
            return { approved: false, requireManager: true, reason: 'High risk profile prevents automatic discount approval' };
        }

        if (discountPercent > 0.10 && !request.competitorPresent && request.trustScore < 50) {
            return { approved: false, requireManager: true, reason: 'Trust score too low for >10% unsolicited discount' };
        }

        return { approved: true, reason: 'Auto-approved by policy' };
    }
}
