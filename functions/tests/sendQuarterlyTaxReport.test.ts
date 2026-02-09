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

// Mock dependencies
vi.mock('npm:@base44/sdk@0.8.6', () => ({
    createClientFromRequest: vi.fn().mockReturnValue({
        asServiceRole: {
            entities: {
                User: { list: vi.fn() },
                RevenueTransaction: { filter: vi.fn() },
                Expense: { filter: vi.fn() }
            },
            integrations: {
                Core: { SendEmail: vi.fn() }
            }
        }
    })
}));

vi.mock('../logic/taxReport.ts', () => ({
    sendQuarterlyTaxReportLogic: vi.fn(),
    // We mock the type as well just in case, though usually not needed for runtime
}));

// Import the module to register the handler
import { sendQuarterlyTaxReportLogic } from '../logic/taxReport.ts';

describe('sendQuarterlyTaxReport', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.resetModules();
        // Dynamic import to ensure Deno mock is set up before execution
        await import('../sendQuarterlyTaxReport.ts');
    });

    it('should return 401 if CRON_SECRET is not set', async () => {
        (Deno.env.get as any).mockImplementation((key: string) => {
            if (key === 'CRON_SECRET') return undefined;
            return undefined;
        });

        const req = new Request('https://api.zerithum.com/functions/sendQuarterlyTaxReport', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer some_secret' }
        });

        const res = await handler(req);
        expect(res.status).toBe(401);
        const data = await res.json();
        expect(data).toEqual({ error: 'Unauthorized' });
    });

    it('should return 401 if Authorization header is missing', async () => {
        (Deno.env.get as any).mockReturnValue('valid_secret');

        const req = new Request('https://api.zerithum.com/functions/sendQuarterlyTaxReport', {
            method: 'GET',
            headers: {}
        });

        const res = await handler(req);
        expect(res.status).toBe(401);
    });

    it('should return 401 if Authorization header is incorrect', async () => {
        (Deno.env.get as any).mockReturnValue('valid_secret');

        const req = new Request('https://api.zerithum.com/functions/sendQuarterlyTaxReport', {
            method: 'GET',
            headers: { 'Authorization': 'Bearer wrong_secret' }
        });

        const res = await handler(req);
        expect(res.status).toBe(401);
    });

    it('should return 200 and execute logic if authorized', async () => {
        const secret = 'valid_secret';
        (Deno.env.get as any).mockReturnValue(secret);
        (sendQuarterlyTaxReportLogic as any).mockResolvedValue({ success: true, users_notified: 10 });

        const req = new Request('https://api.zerithum.com/functions/sendQuarterlyTaxReport', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${secret}` }
        });

        const res = await handler(req);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual({ success: true, users_notified: 10 });
        expect(sendQuarterlyTaxReportLogic).toHaveBeenCalled();
    });

    it('should return 500 if logic throws an error', async () => {
        const secret = 'valid_secret';
        (Deno.env.get as any).mockReturnValue(secret);
        const error = new Error('Database connection failed');
        (sendQuarterlyTaxReportLogic as any).mockRejectedValue(error);

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        const req = new Request('https://api.zerithum.com/functions/sendQuarterlyTaxReport', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${secret}` }
        });

        const res = await handler(req);
        expect(res.status).toBe(500);
        const data = await res.json();
        expect(data).toEqual({ error: 'Internal Server Error' });
        expect(consoleSpy).toHaveBeenCalledWith('Quarterly report email error:', error);
    });
});
