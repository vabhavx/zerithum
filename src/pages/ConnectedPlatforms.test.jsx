// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import ConnectedPlatforms from './ConnectedPlatforms';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
    cleanup();
});

// Mock framer-motion
vi.mock('framer-motion', async () => {
    const actual = await vi.importActual('framer-motion');
    return {
        ...actual,
        AnimatePresence: ({ children }) => <>{children}</>,
        motion: {
            div: ({ children, ...props }) => <div {...props}>{children}</div>,
            header: ({ children, ...props }) => <header {...props}>{children}</header>,
            section: ({ children, ...props }) => <section {...props}>{children}</section>,
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

// Mock sonner
vi.mock('sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

describe('ConnectedPlatforms Page', () => {
    it('renders the page title', () => {
        render(<ConnectedPlatforms />);
        expect(screen.getByText('Connected platforms')).toBeInTheDocument();
    });

    it('renders the "No connections match current filters" state initially when empty', () => {
        render(<ConnectedPlatforms />);
        expect(screen.getByText('No connections match current filters.')).toBeInTheDocument();
    });

    it('renders available platforms', () => {
        render(<ConnectedPlatforms />);
        expect(screen.getByText('Available platforms')).toBeInTheDocument();
        expect(screen.getByText('YouTube')).toBeInTheDocument();
    });

    it('renders metrics cards', () => {
        render(<ConnectedPlatforms />);
        expect(screen.getByText('Active data sources')).toBeInTheDocument();
        expect(screen.getByText('Currently synced')).toBeInTheDocument();
    });
});
