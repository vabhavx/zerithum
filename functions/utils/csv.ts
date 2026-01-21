
/**
 * Escapes a string for use in a CSV file, preventing CSV Injection (Formula Injection).
 *
 * @param value The string to escape.
 * @returns The escaped string.
 */
export function escapeCsv(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check for CSV injection characters at the start
  const injectionChars = ['=', '+', '-', '@'];
  let escaped = stringValue;

  if (injectionChars.some(char => stringValue.startsWith(char))) {
    // Prepend a single quote to prevent execution
    escaped = "'" + escaped;
  }

  // If the value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (escaped.includes('"') || escaped.includes(',') || escaped.includes('\n') || escaped.includes('\r')) {
    escaped = '"' + escaped.replace(/"/g, '""') + '"';
  }

  return escaped;
}
