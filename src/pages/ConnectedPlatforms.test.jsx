// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ConnectedPlatforms from './ConnectedPlatforms';
import { PLATFORMS } from '@/lib/platforms';
import * as matchers from '@testing-library/jest-dom/matchers';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { base44 } from '@/api/supabaseClient';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock framer-motion
vi.mock('framer-motion', async () => {
    return {
        AnimatePresence: ({ children }) => <>{children}</>,
        motion: {
            div: ({ children, ...props }) => <div {...props}>{children}</div>,
            section: ({ children, ...props }) => <section {...props}>{children}</section>,
            header: ({ children, ...props }) => <header {...props}>{children}</header>,
        },
    };
});

// Mock Lucide icons
vi.mock('lucide-react', () => {
    const Icon = (props) => <div data-testid="icon" {...props} />;
    return {
        AlertTriangle: Icon,
        CheckCircle2: Icon,
        Loader2: Icon,
        Plug: Icon,
        RefreshCw: Icon,
        Search: Icon,
        ShieldCheck: Icon,
        Unplug: Icon,
        // Add others if needed
        Youtube: Icon,
        Users: Icon,
        ShoppingBag: Icon,
        CircleDollarSign: Icon,
        Music: Icon,
        Store: Icon,
        Tv: Icon,
        FileText: Icon,
        X: Icon,
    };
});

// Mock base44
vi.mock('@/api/supabaseClient', () => ({
    base44: {
        auth: {
            me: vi.fn().mockResolvedValue({ id: 'user-123' }),
        },
        entities: {
            ConnectedPlatform: {
                filter: vi.fn().mockResolvedValue([]),
                delete: vi.fn().mockResolvedValue({}),
                create: vi.fn().mockResolvedValue({}),
            },
            SyncHistory: {
                filter: vi.fn().mockResolvedValue([]),
            },
        },
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: { success: true } }),
        },
    },
}));

// Mock Sonner toast
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const renderWithProviders = (ui) => {
    return render(
        <QueryClientProvider client={queryClient}>
            {ui}
        </QueryClientProvider>
    );
};

describe('ConnectedPlatforms Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        base44.entities.ConnectedPlatform.filter.mockResolvedValue([]);
        base44.entities.SyncHistory.filter.mockResolvedValue([]);
    });

    it('renders the page title', async () => {
        renderWithProviders(<ConnectedPlatforms />);
        expect(screen.getByText('Connected platforms')).toBeInTheDocument();
    });

    it('renders available platforms', async () => {
        renderWithProviders(<ConnectedPlatforms />);
        const youtube = screen.getAllByText('YouTube');
        expect(youtube.length).toBeGreaterThan(0);
    });

    it('renders connected platforms when data exists', async () => {
        const mockConnected = [
            {
                id: 'conn-1',
                platform: 'youtube',
                sync_status: 'active',
                connected_at: new Date().toISOString(),
                last_synced_at: new Date().toISOString(),
                user_id: 'user-123',
            }
        ];
        base44.entities.ConnectedPlatform.filter.mockResolvedValue(mockConnected);

        renderWithProviders(<ConnectedPlatforms />);

        await waitFor(() => {
            expect(screen.getAllByText('Synced').length).toBeGreaterThan(0);
        });
    });
});
