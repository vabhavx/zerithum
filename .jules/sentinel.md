## 2024-05-23 - Hardcoded Secrets & Information Exposure
**Vulnerability:** Found hardcoded OAuth Client IDs and generic error handling that exposes stack traces/internal error messages to the client. Also found a redundant file with similar issues.
**Learning:** Hardcoding "public" secrets like Client IDs is common but bad practice as it prevents environment separation. Exposing raw error messages can leak sensitive internal state or upstream API details.
**Prevention:**
1. Always use `Deno.env.get()` for configuration.
2. Catch errors and return a generic "Internal Server Error" message to the client, while logging the full error server-side.
3. Remove dead code to reduce attack surface.
## 2024-05-24 - CSV Injection in Tax Reports
**Vulnerability:** Found CSV Injection (Formula Injection) vulnerability in functions/exportTaxReport.ts where user-controlled inputs (Platform, Category, Description) were inserted into CSV without escaping triggers like =, +, -, @.
**Learning:** CSV files are not just text; they are interpreted by spreadsheets as code. Simply quoting fields is not enough; formula triggers must be neutralized. Also, blindly escaping all fields can break negative numbers usage if they are treated as text.
**Prevention:** Always use a dedicated escapeCsv utility that handles both quoting (for delimiters) and prefixing (for formula triggers). Differentiate between text fields (need strict escaping) and numeric fields (safe if validated).
