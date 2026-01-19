## 2024-05-23 - Transactions List Optimization
**Learning:** Extracting list items into `React.memo` components dramatically reduces re-renders when list state (like expansion) changes, especially for lists with hundreds of items. Ensure event handlers passed to memoized components are stable using `useCallback`.
**Action:** Apply this pattern to other large lists in the application (e.g., `ConnectedPlatforms`, `Notifications`) if they become interactive.

## 2024-05-24 - React Query Mutation Stability
**Learning:** The object returned by `useMutation` is not referentially stable. When using it in `useCallback` dependencies to prevent re-renders, use the `mutate` function directly (e.g., `[mutation.mutate]`) rather than the entire object.
**Action:** Audit all `useCallback` hooks that depend on mutations to ensure they use `.mutate`.
