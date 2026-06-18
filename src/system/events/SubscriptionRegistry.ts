// STAGE 39 - Runtime Memory Safety

interface SubscriptionRecord {
    componentId: string;
    eventType: string;
    disposer: () => void;
    timestamp: number;
}

class SubscriptionRegistryImpl {
    private subscriptions: Map<string, SubscriptionRecord> = new Map();

    register(componentId: string, eventType: string, disposer: () => void): string {
        const subId = `${componentId}_${eventType}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        this.subscriptions.set(subId, {
            componentId,
            eventType,
            disposer,
            timestamp: Date.now()
        });

        return subId;
    }

    unregister(subId: string) {
        if (this.subscriptions.has(subId)) {
            const sub = this.subscriptions.get(subId);
            if (sub && sub.disposer) {
                try {
                    sub.disposer();
                } catch (e) {
                    console.error(`[MEMORY SAFETY] Error disposing subscription ${subId}`, e);
                }
            }
            this.subscriptions.delete(subId);
        }
    }

    // Watchdog to prevent orphan subscriptions
    runWatchdog() {
        console.log(`[MEMORY SAFETY] Watchdog checking ${this.subscriptions.size} active subscriptions...`);
        // In a real React DOM, we might verify if the component associated with componentId is still mounted.
        // For now, this serves as an architectural placeholder to track leaks.
    }
}

export const SubscriptionRegistry = new SubscriptionRegistryImpl();
