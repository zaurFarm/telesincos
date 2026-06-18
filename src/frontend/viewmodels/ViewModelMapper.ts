import { DealContext } from '../../engines/negotiation/DealStateMachine';
import { DealViewModel } from './DealViewModel';

export class ViewModelMapper {
    static toDealViewModel(ctx: DealContext, id: string): DealViewModel {
        let riskColor = 'green';
        if (ctx.riskLevel > 80) riskColor = 'red';
        else if (ctx.riskLevel > 50) riskColor = 'yellow';

        let urgencyLevel = 1;
        if (ctx.state === 'PAYMENT_PENDING') urgencyLevel = 3;
        if (ctx.state === 'HANDOFF') urgencyLevel = 4;

        return {
            id,
            stateLabel: ctx.state,
            riskColor,
            urgencyLevel,
            recommendation: 'CONTINUE', 
            confidence: ctx.trustScore,
            dealValue: ctx.proposedPrice || 0
        };
    }
}
