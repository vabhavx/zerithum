## 2024-05-23 - Transactions List Optimization
**Learning:** Extracting list items into `React.memo` components dramatically reduces re-renders when list state (like expansion) changes, especially for lists with hundreds of items. Ensure event handlers passed to memoized components are stable using `useCallback`.
**Action:** Apply this pattern to other large lists in the application (e.g., `ConnectedPlatforms`, `Notifications`) if they become interactive.

## 2024-05-24 - React Query Mutation Stability
**Learning:** The object returned by `useMutation` is not referentially stable. When using it in `useCallback` dependencies to prevent re-renders, use the `mutate` function directly (e.g., `[mutation.mutate]`) rather than the entire object.
**Action:** Audit all `useCallback` hooks that depend on mutations to ensure they use `.mutate`.

## 2024-05-25 - Inline List Rendering Performance
**Learning:** Even if a child component is memoized, rendering it within an inline `map` inside the parent's render function can still be expensive if the list is long or the parent re-renders frequently (e.g. on input). Extracting the row into a separate `React.memo` component prevents unnecessary reconciliation of the list items.
**Action:** Always extract list item rendering into separate components, especially for lists that share state with interactive elements (like dialogs or inputs).

## 2024-05-26 - Single-Pass Aggregation Pattern
**Learning:** React `useMemo` blocks often contain multiple array traversals (filter, reduce, map) that can be collapsed into a single O(N) loop. Extracting this into a pure utility function improves performance and makes the complex logic testable in isolation.
**Action:** When seeing multiple `filter` + `reduce` chains on the same dataset in a component, refactor into a single-pass utility function.
