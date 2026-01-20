## 2024-05-23 - Hardcoded Secrets & Information Exposure
**Vulnerability:** Found hardcoded OAuth Client IDs and generic error handling that exposes stack traces/internal error messages to the client. Also found a redundant file with similar issues.
**Learning:** Hardcoding "public" secrets like Client IDs is common but bad practice as it prevents environment separation. Exposing raw error messages can leak sensitive internal state or upstream API details.
**Prevention:**
1. Always use `Deno.env.get()` for configuration.
2. Catch errors and return a generic "Internal Server Error" message to the client, while logging the full error server-side.
3. Remove dead code to reduce attack surface.

## 2024-05-23 - CSV Injection (Formula Injection)
**Vulnerability:** User-controlled input (like descriptions or names) starting with special characters (=, +, -, @) could be executed as formulas in spreadsheet software when exported to CSV.
**Learning:** CSV exports are not just text dumps; they are interpreted by spreadsheet software.
**Prevention:** Use `escapeCsv` utility (backend: `functions/utils/csv.ts`, frontend: `src/lib/csv.js`) to prepend `'` to dangerous characters and properly quote fields.
