## 2024-05-23 - Hardcoded Secrets & Information Exposure
**Vulnerability:** Found hardcoded OAuth Client IDs and generic error handling that exposes stack traces/internal error messages to the client. Also found a redundant file with similar issues.
**Learning:** Hardcoding "public" secrets like Client IDs is common but bad practice as it prevents environment separation. Exposing raw error messages can leak sensitive internal state or upstream API details.
**Prevention:**
1. Always use `Deno.env.get()` for configuration.
2. Catch errors and return a generic "Internal Server Error" message to the client, while logging the full error server-side.
3. Remove dead code to reduce attack surface.

## 2025-05-27 - CSV Injection (Formula Injection)
**Vulnerability:** The tax export function manually constructed CSV lines, properly escaping quotes but failing to escape formula injection characters (`=`, `+`, `-`, `@`).
**Learning:** Standard CSV escaping (quotes) is not enough. Spreadsheet software executes formulas if a cell starts with special characters, allowing data exfiltration or client-side attacks.
**Prevention:**
1. Use a dedicated `escapeCsv` utility for all user-controlled text fields.
2. Prefix unsafe values (starting with `=+-@`) with a single quote `'` or tab to force text interpretation.
3. Do not apply this to strict numeric fields (like currency) to preserve formatting.

## 2025-05-27 - Price Manipulation in Payment Flow
**Vulnerability:** The payment creation function trusted the `amount` sent by the client, allowing users to pay arbitrary amounts for subscriptions.
**Learning:** Relying on client-provided financial values is a critical flaw. Even if the UI sends the correct amount, the API request can be intercepted and modified.
**Prevention:**
1. Centralize pricing logic on the server/backend.
2. Accept only references (plan IDs/names) from the client, not raw values.
3. Validate all inputs against authoritative sources before processing payments.
