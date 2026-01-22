## 2024-05-23 - Hardcoded Secrets & Information Exposure
**Vulnerability:** Found hardcoded OAuth Client IDs and generic error handling that exposes stack traces/internal error messages to the client. Also found a redundant file with similar issues.
**Learning:** Hardcoding "public" secrets like Client IDs is common but bad practice as it prevents environment separation. Exposing raw error messages can leak sensitive internal state or upstream API details.
**Prevention:**
1. Always use `Deno.env.get()` for configuration.
2. Catch errors and return a generic "Internal Server Error" message to the client, while logging the full error server-side.
3. Remove dead code to reduce attack surface.
## 2024-05-23 - CSV Injection in Reports
**Vulnerability:** Found manual CSV construction in `exportTaxReport` that allowed Formula Injection (e.g. `=cmd|...`) via user inputs like name/platform.
**Learning:** Manual string concatenation for CSVs often misses injection vectors (starting with `=`, `@`, etc.) even if it handles quotes.
**Prevention:**
1. Use `functions/utils/csv.ts` `escapeCsv` for ALL user-controlled text in CSVs.
2. Do NOT apply `escapeCsv` to formatted currency (e.g. `-0.00`) as it forces text interpretation.
