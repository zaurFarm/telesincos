export const TIMELINE_EVENTS = {
    CLIENT_REPLY: 'TIMELINE_CLIENT_REPLY',
    AGENT_REPLY: 'TIMELINE_AGENT_REPLY',
    DEAL_STALLED: 'TIMELINE_DEAL_STALLED'
} as const;

export interface ClientReplyPayload {
    dealId: string;
    clientId: string;
    message: string;
    intentScore?: number;
    timestamp: number;
}
