// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import ConnectedPlatforms from './ConnectedPlatforms';
import { PLATFORMS } from '@/lib/platforms';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock framer-motion
vi.mock('framer-motion', async () => {
    return {
        AnimatePresence: ({ children }) => <>{children}</>,
        motion: {
            div: ({ children, ...props }) => <div {...props}>{children}</div>,
        },
    };
});

// Mock react-query
vi.mock('@tanstack/react-query', () => ({
    useQuery: ({ queryKey }) => {
        if (queryKey[0] === 'connectedPlatforms') {
            return { data: [], isLoading: false };
        }
        if (queryKey[0] === 'syncHistory') {
            return { data: [] };
        }
        return { data: undefined };
    },
    useMutation: () => ({
        mutate: vi.fn(),
        isPending: false,
    }),
    useQueryClient: () => ({
        invalidateQueries: vi.fn(),
    }),
}));

// Mock recharts
vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }) => <div data-testid="recharts-responsive">{children}</div>,
    PieChart: ({ children }) => <div data-testid="recharts-piechart">{children}</div>,
    Pie: () => <div data-testid="recharts-pie" />,
    Cell: () => <div data-testid="recharts-cell" />,
    BarChart: ({ children }) => <div data-testid="recharts-barchart">{children}</div>,
    Bar: () => <div data-testid="recharts-bar" />,
    XAxis: () => <div data-testid="recharts-xaxis" />,
    YAxis: () => <div data-testid="recharts-yaxis" />,
    Tooltip: () => <div data-testid="recharts-tooltip" />,
    Legend: () => <div data-testid="recharts-legend" />,
}));

// Mock base44
vi.mock('@/api/supabaseClient', () => ({
    base44: {
        auth: {
            me: vi.fn().mockResolvedValue({ id: 'user-123' }),
        },
        entities: {
            ConnectedPlatform: {
                filter: vi.fn().mockResolvedValue([]),
                delete: vi.fn(),
                create: vi.fn(),
                update: vi.fn(),
            },
            SyncHistory: {
                filter: vi.fn().mockResolvedValue([]),
            },
        },
        functions: {
            invoke: vi.fn(),
        },
    },
}));

// Mock components that might cause issues
vi.mock('../components/platform/PlatformSyncHistory', () => ({ default: () => <div data-testid="sync-history-dialog" /> }));
vi.mock('../components/platform/ConnectedPlatformRow', () => ({ default: () => <div data-testid="connected-platform-row" /> }));
vi.mock('../components/platform/SyncHistoryRow', () => ({ default: () => <div data-testid="sync-history-row" /> }));
vi.mock('../components/shared/MotivationalQuote', () => ({ default: () => <div data-testid="motivational-quote" /> }));
vi.mock('../components/shared/SuccessConfetti', () => ({ default: () => <div data-testid="success-confetti" /> }));

describe('ConnectedPlatforms Page', () => {
    it('renders the page title', () => {
        render(<ConnectedPlatforms />);
        expect(screen.getByText('Connected Platforms')).toBeInTheDocument();
    });

    it('renders the "No platforms connected" state initially', () => {
        render(<ConnectedPlatforms />);
        // Use getAllByText in case of duplicates, though we expect one specific heading ideally.
        const headings = screen.getAllByText('No platforms connected');
        expect(headings[0]).toBeInTheDocument();

        // There are multiple "Connect Platform" buttons (one in header, one in empty state)
        const buttons = screen.getAllByText('Connect Platform');
        expect(buttons.length).toBeGreaterThan(0);
    });

    it('opens the connect dialog when clicking Connect Platform', async () => {
        render(<ConnectedPlatforms />);
        // Click the one in the empty state or header
        const connectBtns = screen.getAllByText('Connect Platform');
        connectBtns[0].click();

        await waitFor(() => {
             // The dialog title is "Connect Platform"
             // Use role 'heading' to be specific, or getAllByText if multiple
             // DialogTitle usually renders an h2 or similar
             const titles = screen.getAllByText('Connect Platform');
             // We expect one of them to be visible and inside the dialog
             // Just checking if any exists is enough for this smoke test
             expect(titles.length).toBeGreaterThan(0);
        });

        // Verify some platforms from the constant are rendered in the dialog
        PLATFORMS.forEach(platform => {
            if (!platform.requiresApiKey && !platform.requiresShopName) {
                expect(screen.getByText(platform.name)).toBeInTheDocument();
            }
        });
    });
});
