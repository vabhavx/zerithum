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

## 2025-05-29 - Payment Parameter Tampering
**Vulnerability:** The payment creation endpoint accepted `amount` and `currency` directly from the client request body, allowing a malicious user to modify the price (e.g., paying $1 for a $199 plan).
**Learning:** Never trust client input for critical business logic like pricing. The client should only provide the intent (e.g., `planName`), and the server must determine the details from a trusted source.
**Prevention:**
1. Store product/plan definitions (prices, SKUs) server-side or in a database.
2. Accept only the Plan ID/Name from the client.
3. Look up the price server-side before initiating the payment with the provider.
