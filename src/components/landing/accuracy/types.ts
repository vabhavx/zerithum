export type EventStatus = 'matched' | 'review' | 'flagged';

export interface RevenueEvent {
    id: string;
    source: string;
    amount: string;
    status: EventStatus;
    confidence: number;
    date: string;
    trace: { step: string; time: string; hash: string }[];
    explanation: string;
    changelog: { action: string; time: string }[];
    raw_data?: string;
}
