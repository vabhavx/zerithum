import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('npm:@base44/sdk@0.8.6', () => ({
  createClientFromRequest: vi.fn(),
}));

vi.mock('../logic/taxReport.ts', () => ({
  sendQuarterlyTaxReportLogic: vi.fn().mockResolvedValue({ success: true }),
}));

describe('sendQuarterlyTaxReport', () => {
  let serveHandler: any;

  beforeEach(async () => {
    vi.resetModules();

    // Mock Deno global before import
    (globalThis as any).Deno = {
      serve: vi.fn((handler) => {
        serveHandler = handler;
      }),
      env: {
        get: vi.fn(),
      },
    };

    // Import the module to trigger Deno.serve
    await import('../sendQuarterlyTaxReport.ts');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete (globalThis as any).Deno;
  });

  it('should return 401 if CRON_SECRET is not set', async () => {
    ((globalThis as any).Deno.env.get as any).mockImplementation((key: string) => {
        if (key === 'CRON_SECRET') return undefined;
        return undefined;
    });

    const req = new Request('http://localhost', {
      headers: { Authorization: 'Bearer valid_secret' },
    });

    const res = await serveHandler(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 if Authorization header is missing', async () => {
    ((globalThis as any).Deno.env.get as any).mockImplementation((key: string) => {
        if (key === 'CRON_SECRET') return 'valid_secret';
        return undefined;
    });

    const req = new Request('http://localhost');

    const res = await serveHandler(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should return 401 if Authorization header is incorrect', async () => {
    ((globalThis as any).Deno.env.get as any).mockImplementation((key: string) => {
        if (key === 'CRON_SECRET') return 'valid_secret';
        return undefined;
    });

    const req = new Request('http://localhost', {
      headers: { Authorization: 'Bearer wrong_secret' },
    });

    const res = await serveHandler(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('should proceed if authorized', async () => {
    ((globalThis as any).Deno.env.get as any).mockImplementation((key: string) => {
        if (key === 'CRON_SECRET') return 'valid_secret';
        return undefined;
    });

    const req = new Request('http://localhost', {
      headers: { Authorization: 'Bearer valid_secret' },
    });

    const res = await serveHandler(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
  });
});
