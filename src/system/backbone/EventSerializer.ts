export class EventSerializer {
    static serialize(payload: any): string {
        return JSON.stringify({
            data: payload,
            __metadata: {
                timestamp: Date.now(),
                version: '1.0'
            }
        });
    }

    static deserialize(raw: string): any {
        try {
            const parsed = JSON.parse(raw);
            return parsed.data || parsed;
        } catch {
            return null;
        }
    }
}
