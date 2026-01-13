## 2025-05-23 - Context-Dependent Buttons
**Learning:** Generic button labels like "Connect" or "Disconnect" in a list of items are confusing for screen reader users because they don't know *which* item the button affects without context.
**Action:** Always add `aria-label` to buttons in a list (e.g., `aria-label="Connect to YouTube"`) to provide specific context. Also, consider adding `title` attributes for sighted users using a mouse.

## 2025-05-24 - Accessible Table Headers
**Learning:** `<th>` elements with `onClick` are not keyboard accessible by default, preventing keyboard users from sorting tables.
**Action:** Wrap header content in a `<button>` inside the `<th>`. Use `aria-sort` on the `th` to indicate sort direction, and ensure the button has focus styles.
