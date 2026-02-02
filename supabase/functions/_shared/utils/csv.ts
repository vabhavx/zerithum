
/**
 * Escapes a string for use in a CSV file.
 * Handles quoting and escaping of double quotes.
 * Mitigates CSV Injection (Formula Injection) by prepending a single quote
 * to values starting with =, +, -, or @.
 *
 * @param value - The value to escape.
 * @returns The escaped string, ready to be placed in a CSV line.
 */
export function escapeCsv(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check for CSV Injection characters at the start
  let potentiallyUnsafe = false;
  if (/^[=+\-@]/.test(stringValue)) {
    potentiallyUnsafe = true;
  }

  // Escape double quotes
  let escaped = stringValue.replace(/"/g, '""');

  // If it's potentially unsafe, prepend a single quote to force text interpretation
  if (potentiallyUnsafe) {
    escaped = `'${escaped}`;
  }

  // Wrap in double quotes if it contains special characters (quotes, commas, newlines)
  // OR if we modified it (to ensure the single quote is treated as part of the value by some parsers,
  // and to be safe/consistent).
  if (/[",\n\r]/.test(stringValue) || potentiallyUnsafe) {
    return `"${escaped}"`;
  }

  return escaped;
}
