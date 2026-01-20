
/**
 * Escapes a string for CSV format, preventing CSV Injection (Formula Injection)
 * and handling standard CSV quoting/escaping.
 *
 * @param value - The string to escape.
 * @returns The escaped string, ready to be inserted into a CSV line.
 */
export function escapeCsv(value: string | undefined | null): string {
  if (!value) return '';

  let safeValue = String(value);

  // Prevent CSV Injection (Formula Injection)
  // If the value starts with =, +, -, or @, Excel/Sheets might interpret it as a formula.
  // We prepend a single quote to force it to be treated as text.
  if (/^[=+\-@]/.test(safeValue)) {
    safeValue = "'" + safeValue;
  }

  // Standard CSV escaping
  // If the value contains a comma, double quote, or newline/carriage return,
  // we must enclose it in double quotes.
  // Existing double quotes must be escaped by doubling them ("").
  if (/[",\n\r]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }

  return safeValue;
}
