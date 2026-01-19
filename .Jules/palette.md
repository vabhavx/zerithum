## 2025-05-23 - Context-Dependent Buttons
**Learning:** Generic button labels like "Connect" or "Disconnect" in a list of items are confusing for screen reader users because they don't know *which* item the button affects without context.
**Action:** Always add `aria-label` to buttons in a list (e.g., `aria-label="Connect to YouTube"`) to provide specific context. Also, consider adding `title` attributes for sighted users using a mouse.

## 2025-05-24 - Accessible Table Headers
**Learning:** `<th>` elements with `onClick` are not keyboard accessible by default, preventing keyboard users from sorting tables.
**Action:** Wrap header content in a `<button>` inside the `<th>`. Use `aria-sort` on the `th` to indicate sort direction, and ensure the button has focus styles.

## 2026-01-16 - Implicit Form Labeling
**Learning:** Using `Label` components near inputs without explicit `htmlFor` and `id` linking breaks accessibility for screen readers and reduces hit area for mouse users.
**Action:** Always assign unique `id`s to inputs/triggers and use `htmlFor` on `Label` components to programmatically link them.

## 2025-05-25 - Dashboard Alerts
**Learning:** Dismissible alerts and panels in dashboards often use icon-only "X" buttons that lack accessible labels, leaving screen reader users stuck in a list of "button" announcements.
**Action:** Always add `aria-label="Dismiss alert"` (or specific context like "Dismiss risk warning") to these icon-only close buttons.

## 2025-05-26 - Destructive Actions
**Learning:** Native `window.confirm` breaks the immersive experience and often lacks context for screen readers compared to a custom Dialog.
**Action:** Replace all `window.confirm` calls with the `Dialog` component, ensuring the destructive action button is clearly labeled and possibly colored red.
