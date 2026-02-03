/**
 * Generates a CSV string from an array of data objects and column definitions.
 * Includes a BOM for Excel UTF-8 compatibility.
 * @param {Array<Object>} data - The data to export.
 * @param {Array<{header: string, key: string, formatter?: (value: any) => string}>} columns - Column definitions.
 * @returns {string} The formatted CSV string.
 */
export const generateCSV = (data, columns) => {
    if (!data || !data.length) {
        return '';
    }

    // BOM for Excel to recognize UTF-8
    const BOM = '\uFEFF';

    const headers = columns.map(col => `"${col.header.replace(/"/g, '""')}"`).join(',');

    const rows = data.map(item => {
        return columns.map(col => {
            let value = item[col.key];

            if (col.formatter) {
                value = col.formatter(item);
            }

            if (value === null || value === undefined) {
                return '';
            }

            // If the value is a number and no formatter was used (or formatter returned a number string without symbols),
            // we might want to avoid quotes so Excel treats it as a number.
            // However, to be safe and handle commas/newlines, we stick to quoting everything for now,
            // but ensure we don't have extra spaces.
            // The user wants "sheet/file". CSV is simple. 
            // To force Excel to treat as text (like IDs), ="value" is sometimes used, but standard CSV usage prefers simple quotes.

            const stringValue = String(value);
            // Escape quotes and wrap in quotes to handle commas and newlines
            return `"${stringValue.replace(/"/g, '""')}"`;
        }).join(',');
    });

    return BOM + [headers, ...rows].join('\n');
};

/**
 * Triggers a browser download for the given CSV content.
 * @param {string} csvContent - The CSV string.
 * @param {string} filename - The name of the file to download.
 */
export const downloadCSV = (csvContent, filename) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
};
