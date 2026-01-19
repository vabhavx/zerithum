## 2024-05-23 - Hardcoded Secrets & Information Exposure
**Vulnerability:** Found hardcoded OAuth Client IDs and generic error handling that exposes stack traces/internal error messages to the client. Also found a redundant file with similar issues.
**Learning:** Hardcoding "public" secrets like Client IDs is common but bad practice as it prevents environment separation. Exposing raw error messages can leak sensitive internal state or upstream API details.
**Prevention:**
1. Always use `Deno.env.get()` for configuration.
2. Catch errors and return a generic "Internal Server Error" message to the client, while logging the full error server-side.
3. Remove dead code to reduce attack surface.

## 2024-05-24 - CSV Injection (Formula Injection)
**Vulnerability:** User-controlled data (names, descriptions, platform names) was being directly interpolated into CSV exports without escaping. This allowed for CSV structure corruption (via commas/quotes) and Formula Injection (via `=`).
**Learning:** Standard string replacing of quotes (e.g. `replace(/"/g, '""')`) is insufficient for secure CSV generation. It misses structure validation and does not prevent Formula Injection, which can execute code in Excel.
**Prevention:**
1. Use a robust CSV escaping utility for ALL user-controlled fields.
2. The utility must handle:
   - Wrapping in quotes if containing special chars (comma, quote, newline).
   - Escaping internal quotes.
   - Prepending `'` if the field starts with formula triggers (`=`, `+`, `-`, `@`).
