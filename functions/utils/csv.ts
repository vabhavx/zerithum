
/**
 * Escapes a field for CSV inclusion.
 * Handles quoting and prevents formula injection (CSV Injection).
 *
 * @param field The value to escape
 * @returns The escaped CSV string
 */
export function escapeCsv(field: string | number | null | undefined): string {
  if (field === null || field === undefined) {
    return '';
  }

  let stringField = String(field);

  // Check for formula injection triggers
  // OWASP: Ensure that any cell starting with one of the following characters: =, +, -, or @
  // is prepended with a single quote or tab.
  const isFormula = /^[=+\-@]/.test(stringField);

  // If it's a formula, prepend a single quote to force text interpretation
  if (isFormula) {
    stringField = `'${stringField}`;
  }

  // Double quotes must be escaped by another double quote
  const escaped = stringField.replace(/"/g, '""');

  // Fields containing commas, double quotes, or newlines must be quoted
  // We also quote if we modified it to prevent formula injection (optional but cleaner)
  const needsQuotes = /[",\n\r]/.test(stringField);

  if (needsQuotes) {
    return `"${escaped}"`;
  }

  return stringField;
}
