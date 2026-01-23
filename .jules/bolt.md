## 2024-05-23 - Transactions List Optimization
**Learning:** Extracting list items into `React.memo` components dramatically reduces re-renders when list state (like expansion) changes, especially for lists with hundreds of items. Ensure event handlers passed to memoized components are stable using `useCallback`.
**Action:** Apply this pattern to other large lists in the application (e.g., `ConnectedPlatforms`, `Notifications`) if they become interactive.

## 2024-05-24 - React Query Mutation Stability
**Learning:** The object returned by `useMutation` is not referentially stable. When using it in `useCallback` dependencies to prevent re-renders, use the `mutate` function directly (e.g., `[mutation.mutate]`) rather than the entire object.
**Action:** Audit all `useCallback` hooks that depend on mutations to ensure they use `.mutate`.

## 2025-01-23 - Dashboard Component Memoization
**Learning:** `useQuery` data is referentially stable if the cache hasn't updated, but inline filtering (e.g., `data.filter(...)`) creates new references on every render, defeating `React.memo` on child components. Always use `useMemo` for derived data passed to memoized components.
**Action:** Review all `useQuery` usages where data is filtered or transformed inline before passing to child components.
