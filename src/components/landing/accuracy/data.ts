import { RevenueEvent } from './types';

export const EVENTS: RevenueEvent[] = [
    {
        id: 'evt-001',
        source: 'YouTube AdSense',
        amount: '$8,432.10',
        status: 'matched',
        confidence: 99,
        date: 'Oct 24, 2:30 PM',
        trace: [
            { step: 'API Ingest', time: '00:00:01s', hash: '8f7a2b' },
            { step: 'Normalization', time: '00:00:02s', hash: 'c4d5e6' },
            { step: 'Settlement', time: '00:00:05s', hash: 'a1b2c3' }
        ],
        explanation: 'Exact match: $8,432.10 == $8,432.10 (tolerance: $0.00)',
        changelog: [
            { action: 'Ingested', time: '2:30:05 PM' },
            { action: 'Reconciled', time: '2:30:12 PM' }
        ]
    },
    {
        id: 'evt-002',
        source: 'Stripe Payments',
        amount: '$1,250.00',
        status: 'matched',
        confidence: 98,
        date: 'Oct 24, 4:15 PM',
        trace: [
            { step: 'Webhook Rx', time: '00:00:00s', hash: 'e9f0a1' },
            { step: 'Fee Calc', time: '00:00:01s', hash: 'b2c3d4' },
            { step: 'Net Match', time: '00:00:03s', hash: '5e6f7a' }
        ],
        explanation: 'Net match: $1,287.50 - $37.50 (fees) == $1,250.00',
        changelog: [
            { action: 'Webhook Rx', time: '4:15:22 PM' },
            { action: 'Fees Applied', time: '4:15:23 PM' }
        ]
    },
    {
        id: 'evt-003',
        source: 'Patreon Payout',
        amount: '$3,890.55',
        status: 'review',
        confidence: 45,
        date: 'Oct 25, 9:00 AM',
        trace: [
            { step: 'CSV Import', time: '00:00:10s', hash: '1a2b3c' },
            { step: 'Bank Feed', time: '---', hash: 'pending' },
            { step: 'Review Req', time: 'Now', hash: 'alert_01' }
        ],
        explanation: 'Mismatch: Expected ~$3,890.55, Found $3,700.00 (Delta: 4.8%)',
        changelog: [
            { action: 'CSV Parsed', time: '9:00:01 AM' },
            { action: 'Mismatch Flag', time: '9:00:05 AM' }
        ],
        raw_data: '{"payout_id": "pt_998877", "currency": "USD", "status": "processed"}'
    },
    {
        id: 'evt-004',
        source: 'Brand Deal (Agency)',
        amount: '$15,000.00',
        status: 'flagged',
        confidence: 12,
        date: 'Oct 26, 11:45 AM',
        trace: [
            { step: 'Manual Entry', time: '00:00:00s', hash: 'user_x' },
            { step: 'Deposit Check', time: '---', hash: 'missing' },
            { step: 'Anomaly', time: 'Now', hash: 'alert_02' }
        ],
        explanation: 'Anomaly: Large manual entry > $10k with no deposit signal.',
        changelog: [
            { action: 'User Created', time: '11:45:00 AM' },
            { action: 'System Alert', time: '11:45:02 AM' }
        ]
    },
    {
        id: 'evt-005',
        source: 'Twitch Subs',
        amount: '$420.69',
        status: 'matched',
        confidence: 96,
        date: 'Oct 26, 3:20 PM',
        trace: [
            { step: 'API Ingest', time: '00:00:01s', hash: 't_5566' },
            { step: 'Threshold', time: '00:00:02s', hash: 'sys_ok' },
            { step: 'Settlement', time: '00:00:04s', hash: 'bank_ok' }
        ],
        explanation: 'Payout schedule match. 45 day net terms satisfied.',
        changelog: [
            { action: 'Ingested', time: '3:20:10 PM' },
            { action: 'Matched', time: '3:20:15 PM' }
        ]
    }
];

export const AUTO_PLAY_INTERVAL = 4000;

export const SEQUENCE_STEPS = [
    { action: 'expand', target: 'evt-003', delay: 1000 },
    { action: 'tab', target: 'trace', delay: 800 },
    { action: 'tab', target: 'explain', delay: 1500 },
    { action: 'tab', target: 'resolve', delay: 1500 },
    { action: 'resolve_simulate', target: 'confirmed', delay: 1200 },
    { action: 'reset', delay: 1000 }
];
