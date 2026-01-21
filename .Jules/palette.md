## 2024-05-23 - Chat Interface Accessibility
**Learning:** Chat interfaces require `role="log"` and `aria-live="polite"` on the message container to ensure screen readers announce new messages automatically without interrupting the user's typing flow.
**Action:** Always wrap chat message lists in a live region and ensure input fields and send buttons have explicit accessible labels since they often rely on placeholders or icons.
