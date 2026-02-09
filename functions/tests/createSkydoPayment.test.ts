import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Deno environment
let handler: any;
globalThis.Deno = {
    env: {
        get: vi.fn()
    },
    serve: vi.fn().mockImplementation((h) => {
        handler = h;
    })
} as any;

// Mock base44 sdk - mock both the local path and the npm path if necessary
vi.mock('npm:@base44/sdk@0.8.6', () => ({
    createClientFromRequest: vi.fn().mockReturnValue({
        auth: {
            me: vi.fn().mockResolvedValue({ id: 'user_1', email: 'test@example.com' })
        },
        asServiceRole: {
            entities: {
                AuditLog: {
                    create: vi.fn().mockResolvedValue({})
                }
            }
        }
    })
}));

// Mock payment logic
vi.mock('./logic/paymentLogic.ts', () => ({
    getPlanDetails: vi.fn().mockReturnValue({ price: 49, currency: 'USD' })
}));

describe('createSkydoPayment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Since we import the file, and it calls Deno.serve, we need to make sure we capture it
    });

    it('should return 500 if APP_URL is not configured', async () => {
        // Mock Deno.env.get
        (Deno.env.get as any).mockImplementation((key: string) => {
            if (key === 'SKYDO_API_KEY') return 'skydo_test_key';
            if (key === 'APP_URL') return undefined;
            return undefined;
        });

        // Trigger the handler registration
        await import('../createSkydoPayment.ts');

        const req = new Request('https://api.example.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planName: 'Creator Pro', billingPeriod: 'monthly' })
        });

        const res = await handler(req);
        expect(res.status).toBe(500);

        const data = await res.json();
        expect(data.error).toBe('APP_URL not configured');
    });

    it('should use APP_URL when configured', async () => {
        const testAppUrl = 'https://myapp.com';
        (Deno.env.get as any).mockImplementation((key: string) => {
            if (key === 'SKYDO_API_KEY') return 'skydo_test_key';
            if (key === 'APP_URL') return testAppUrl;
            return undefined;
        });

        // Mock fetch for Skydo API
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve({ id: 'pay_123', payment_url: 'https://skydo.com/pay/123' })
        });
        globalThis.fetch = mockFetch;

        // Trigger the handler registration
        await import('../createSkydoPayment.ts');

        const req = new Request('https://api.example.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ planName: 'Creator Pro', billingPeriod: 'monthly' })
        });

        const res = await handler(req);
        expect(res.status).toBe(200);

        // Verify fetch was called with correct URLs
        const fetchArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(fetchArgs[1].body);
        expect(body.success_url).toBe(`${testAppUrl}/pricing?payment=success`);
        expect(body.cancel_url).toBe(`${testAppUrl}/pricing?payment=cancelled`);
    });
});
