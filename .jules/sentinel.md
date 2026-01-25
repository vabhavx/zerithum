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

## 2025-05-28 - Information Exposure in Payment Logic
**Vulnerability:** Upstream API error details (including structure and potential internal codes) were leaked directly to the client in the response body.
**Learning:** Returning `error.message` or raw JSON from upstream services can expose internal paths or validation rules that help attackers map the system.
**Prevention:**
1. Use `try/catch` blocks to intercept upstream errors.
2. Log the full error details to the server-side logger (for debugging).
3. Return a generic "Internal Server Error" or "Service Unavailable" message to the client.
