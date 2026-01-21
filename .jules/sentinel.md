# Sentinel's Journal

## 2025-02-18 - CSV Injection (Formula Injection)
**Vulnerability:** User-controlled input (e.g., transaction descriptions, platform names, user names) was being directly embedded into CSV exports without sanitization. If a user entered a value starting with `=`, `+`, `-`, or `@`, it could be interpreted as a formula by spreadsheet software (Excel, Google Sheets), potentially leading to command execution or data exfiltration.
**Learning:** Even "safe" text fields like a platform name or category can be dangerous in the context of a CSV file if they are not properly escaped. The risk is not just about delimiters (commas, quotes) but also about active content execution in the consuming application.
**Prevention:** Always use a dedicated CSV escaping utility that:
1.  Handling standard CSV escaping (quotes, commas, newlines).
2.  Prepends a single quote `'` to fields starting with injection characters (`=`, `+`, `-`, `@`) to force them to be treated as text.
