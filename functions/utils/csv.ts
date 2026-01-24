
/**
 * Escapes a value for inclusion in a CSV file.
 * Handles quoting for special characters (comma, quote, newline)
 * and prevents CSV Injection (Formula Injection).
 *
 * @param value The value to escape
 * @returns The escaped CSV field string
 */
export function escapeCsv(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  // If it's a number, it's safe from injection and quotes
  if (typeof value === 'number') {
    return String(value);
  }

  let stringValue = String(value);

  // Prevent CSV Injection (Formula Injection)
  // If the field starts with =, +, -, @, \t, or \r, prepend a single quote
  // Reference: OWASP CSV Injection
  const injectionChars = ['=', '+', '-', '@', '\t', '\r'];

  // Note: We only apply this check if the value is NOT strictly numeric-looking
  // because valid negative numbers (e.g. "-100") shouldn't be escaped as text
  // unless we are sure. However, distinguishing "-100" (safe) from "-1+1" (unsafe) is hard.
  // Sentinel decision: strict security. If it looks like a formula trigger, escape it.
  // The consumer should ensure numeric fields are passed as numbers or trusted strings that don't need escaping.

  if (injectionChars.some(char => stringValue.startsWith(char))) {
    stringValue = `'${stringValue}`;
  }

  // Escape quotes and wrap in quotes if necessary
  // If field contains comma, quote, or newline, it must be wrapped in quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    stringValue = `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}
