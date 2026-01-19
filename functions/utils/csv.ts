
/**
 * Escapes a string for inclusion in a CSV file.
 * Handles quoting for special characters (comma, quote, newline) and
 * prevents CSV injection (Formula Injection) by prepending a single quote
 * if the value starts with =, +, -, or @.
 *
 * @param value - The value to escape.
 * @returns The escaped string ready for CSV.
 */
export function escapeCsv(value: string | number | undefined | null): string {
  if (value === undefined || value === null) {
    return '';
  }

  const stringValue = String(value);
  let cleanValue = stringValue;

  // Prevent CSV Injection (Formula Injection)
  // If the value starts with a formula trigger, prepend a single quote to force text interpretation.
  if (/^[=+\-@]/.test(cleanValue)) {
    cleanValue = "'" + cleanValue;
  }

  // If the value contains quotes, commas, or newlines, wrap it in quotes and escape internal quotes.
  if (/[",\n\r]/.test(cleanValue)) {
    return `"${cleanValue.replace(/"/g, '""')}"`;
  }

  return cleanValue;
}
