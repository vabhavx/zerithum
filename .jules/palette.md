## 2025-05-21 - Chat Interface Accessibility
**Learning:** Chat interfaces require `role="log"` and `aria-live="polite"` on the message container so screen readers automatically announce new incoming messages without moving focus.
**Action:** Always wrap chat message lists in a container with these attributes and ensure the input and send buttons have explicit labels.
