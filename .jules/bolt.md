## 2024-05-23 - Transactions List Optimization
**Learning:** Extracting list items into `React.memo` components dramatically reduces re-renders when list state (like expansion) changes, especially for lists with hundreds of items. Ensure event handlers passed to memoized components are stable using `useCallback`.
**Action:** Apply this pattern to other large lists in the application (e.g., `ConnectedPlatforms`, `Notifications`) if they become interactive.

## 2024-05-24 - React Query Mutation Stability
**Learning:** The object returned by `useMutation` is not referentially stable. When using it in `useCallback` dependencies to prevent re-renders, use the `mutate` function directly (e.g., `[mutation.mutate]`) rather than the entire object.
**Action:** Audit all `useCallback` hooks that depend on mutations to ensure they use `.mutate`.

## 2024-05-25 - Dashboard Widget Memoization
**Learning:** Heavy dashboard widgets (charts, complex panels) should be wrapped in `React.memo` to prevent re-renders when parent state (like alerts or loading flags) changes. Additionally, derived props passed to these components (like filtered arrays) must be memoized with `useMemo` in the parent to ensure prop stability.
**Action:** Audit other dashboard-like pages (e.g., Reports) for similar patterns where parent state causes unnecessary child re-renders.
