export class MarginProtectionPolicy {
    static validate(basePrice: number, costPrice: number, proposedPrice: number): boolean {
        // Hard rule: Never sell below cost + 10% margin
        const minimalAcceptablePrice = costPrice * 1.10;
        
        if (proposedPrice < minimalAcceptablePrice) {
            return false;
        }
        return true;
    }

    static getMinimumAllowedPrice(costPrice: number): number {
        return Math.ceil(costPrice * 1.10);
    }
}
