## 2025-05-23 - Context-Dependent Buttons
**Learning:** Generic button labels like "Connect" or "Disconnect" in a list of items are confusing for screen reader users because they don't know *which* item the button affects without context.
**Action:** Always add `aria-label` to buttons in a list (e.g., `aria-label="Connect to YouTube"`) to provide specific context. Also, consider adding `title` attributes for sighted users using a mouse.
