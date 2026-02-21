import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the environment variables
vi.stubGlobal('import.meta', {
    env: {
        VITE_SUPABASE_URL: 'https://example.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'test-anon-key'
    }
});

const mockSelect = vi.fn();
const mockOrder = vi.fn();
const mockRange = vi.fn();
const mockEq = vi.fn();
const mockGte = vi.fn();
const mockLte = vi.fn();
const mockIn = vi.fn();

const mockQueryBuilder = {
    select: mockSelect,
    order: mockOrder,
    range: mockRange,
    eq: mockEq,
    gte: mockGte,
    lte: mockLte,
    in: mockIn,
};

// Chain the mocks
mockSelect.mockReturnValue(mockQueryBuilder);
mockOrder.mockReturnValue(mockQueryBuilder);
mockRange.mockReturnValue(mockQueryBuilder);
mockEq.mockReturnValue(mockQueryBuilder);
mockGte.mockReturnValue(mockQueryBuilder);
mockLte.mockReturnValue(mockQueryBuilder);
mockIn.mockReturnValue(mockQueryBuilder);

// Mock supabase-js
vi.mock('@supabase/supabase-js', () => ({
    createClient: () => ({
        from: () => mockQueryBuilder,
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-123' } } })
        }
    })
}));

import { entities } from './supabaseClient';

describe('createEntityHelper fetchAll', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Reset chain returns
        mockSelect.mockReturnValue(mockQueryBuilder);
        mockOrder.mockReturnValue(mockQueryBuilder);
        mockRange.mockReturnValue(mockQueryBuilder);
        mockEq.mockReturnValue(mockQueryBuilder);
        mockGte.mockReturnValue(mockQueryBuilder);
        mockLte.mockReturnValue(mockQueryBuilder);
        mockIn.mockReturnValue(mockQueryBuilder);
    });

    it('should use eq for simple values', async () => {
        // Mock data return
        mockRange.mockResolvedValueOnce({ data: [], error: null });

        await entities.RevenueTransaction.fetchAll({ status: 'completed' });

        expect(mockEq).toHaveBeenCalledWith('status', 'completed');
    });

    it('should use gte/lte for operator objects', async () => {
        // Mock data return
        mockRange.mockResolvedValueOnce({ data: [], error: null });

        await entities.RevenueTransaction.fetchAll({
            transaction_date: { $gte: '2023-01-01', $lte: '2023-12-31' }
        });

        // This should fail currently because the implementation doesn't support $gte/$lte
        expect(mockGte).toHaveBeenCalledWith('transaction_date', '2023-01-01');
        expect(mockLte).toHaveBeenCalledWith('transaction_date', '2023-12-31');
    });
});
