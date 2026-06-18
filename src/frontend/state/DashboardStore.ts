import { RealtimeBridge } from '../realtime/RealtimeBridge';
import { DealViewModel } from '../viewmodels/DealViewModel';
import { ViewModelMapper } from '../viewmodels/ViewModelMapper';

export interface DashboardState {
  activeDeals: DealViewModel[];
  criticalAlerts: any[]; 
  systemHealth: any;
}

type Subscriber = (state: DashboardState) => void;

export class DashboardStore {
    private state: DashboardState = {
        activeDeals: [],
        criticalAlerts: [],
        systemHealth: {}
    };
    private subscribers: Set<Subscriber> = new Set();
    private bridge: RealtimeBridge<any>;

    constructor() {
        this.bridge = new RealtimeBridge<any>((batch) => {
            this.processBatch(batch);
        });
        
        if (typeof window !== 'undefined') {
            window.addEventListener('dashboard:update', (e: any) => {
                this.bridge.dispatch(e.detail);
            });
        }
    }

    private processBatch(batch: any[]) {
         const nextState = { ...this.state };
         let changed = false;

         for (const event of batch) {
             if (event.type === 'DEAL_STATE_CHANGED') {
                 const vm = ViewModelMapper.toDealViewModel(event.payload.context, event.payload.dealId);
                 const index = nextState.activeDeals.findIndex(d => d.id === vm.id);
                 if (index !== -1) {
                     nextState.activeDeals[index] = vm;
                 } else {
                     nextState.activeDeals.push(vm);
                 }
                 changed = true;
             }
             if (event.type === 'RISK_ALERT') {
                nextState.criticalAlerts = [...nextState.criticalAlerts, event.payload].slice(-5);
                changed = true;
             }
         }

         if (changed) {
             this.state = nextState;
             this.notify();
         }
    }

    getState(): DashboardState {
        return this.state;
    }

    subscribe(sub: Subscriber) {
        this.subscribers.add(sub);
        sub(this.state);
        return () => {
            this.subscribers.delete(sub);
        };
    }

    private notify() {
        for (const sub of this.subscribers) {
            sub(this.state);
        }
    }
}

export const GlobalDashboardStore = new DashboardStore();
