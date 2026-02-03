import { describe, it, expect } from 'vitest';
import { generateCSV } from './csvExport';

describe('csvExport', () => {
    describe('generateCSV', () => {
        it('should include BOM for Excel compatibility', () => {
            const data = [{ name: 'Test' }];
            const columns = [{ header: 'Name', key: 'name' }];
            const csv = generateCSV(data, columns);
            expect(csv.charCodeAt(0)).toBe(0xFEFF); // BOM
        });

        it('should generate correct CSV string from data', () => {
            const data = [
                { name: 'Alice', age: 30, city: 'New York' },
                { name: 'Bob', age: 25, city: 'London' }
            ];
            const columns = [
                { header: 'Name', key: 'name' },
                { header: 'Age', key: 'age' },
                { header: 'City', key: 'city' }
            ];

            // BOM + headers + rows
            const BOM = '\uFEFF';
            const expected = BOM + '"Name","Age","City"\n"Alice","30","New York"\n"Bob","25","London"';
            expect(generateCSV(data, columns)).toBe(expected);
        });

        it('should handle special characters (commas, quotes, newlines)', () => {
            const data = [
                { id: 1, text: 'Hello, World' },
                { id: 2, text: 'He said "Hi"' },
                { id: 3, text: 'Line 1\nLine 2' }
            ];
            const columns = [
                { header: 'ID', key: 'id' },
                { header: 'Text', key: 'text' }
            ];

            const BOM = '\uFEFF';
            const expected = BOM + '"ID","Text"\n"1","Hello, World"\n"2","He said ""Hi"""\n"3","Line 1\nLine 2"';
            expect(generateCSV(data, columns)).toBe(expected);
        });

        it('should use formatter if provided', () => {
            const data = [
                { amount: 100 },
                { amount: 200.5 }
            ];
            const columns = [
                { header: 'Amount', key: 'amount', formatter: (item) => `$${item.amount.toFixed(2)}` }
            ];

            const BOM = '\uFEFF';
            const expected = BOM + '"Amount"\n"$100.00"\n"$200.50"';
            expect(generateCSV(data, columns)).toBe(expected);
        });
    });
});
