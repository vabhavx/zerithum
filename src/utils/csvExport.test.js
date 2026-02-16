import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateCSV, downloadCSV } from './csvExport';

describe('csvExport utility', () => {
    describe('generateCSV', () => {
        it('should return an empty string if data is empty, null, or undefined', () => {
            expect(generateCSV([], [])).toBe('');
            expect(generateCSV(null, [])).toBe('');
            expect(generateCSV(undefined, [])).toBe('');
        });

        it('should generate a CSV with BOM, headers, and rows', () => {
            const data = [{ id: 1, name: 'John Doe' }];
            const columns = [
                { header: 'ID', key: 'id' },
                { header: 'Name', key: 'name' }
            ];
            const result = generateCSV(data, columns);

            // Should start with BOM
            expect(result.startsWith('\uFEFF')).toBe(true);

            const content = result.substring(1);
            const lines = content.split('\n');

            expect(lines[0]).toBe('"ID","Name"');
            expect(lines[1]).toBe('"1","John Doe"');
        });

        it('should escape double quotes in headers and data', () => {
            const data = [{ note: 'He said "Hello"' }];
            const columns = [{ header: 'User "Note"', key: 'note' }];
            const result = generateCSV(data, columns);

            expect(result).toContain('"User ""Note"""');
            expect(result).toContain('"He said ""Hello"""');
        });

        it('should handle commas and newlines in data', () => {
            const data = [{ message: 'Hello, World\nNew Line' }];
            const columns = [{ header: 'Message', key: 'message' }];
            const result = generateCSV(data, columns);

            expect(result).toContain('"Hello, World\nNew Line"');
        });

        it('should use custom formatters and pass the full item object', () => {
            const data = [{ amount: 1000, currency: 'USD' }];
            const columns = [
                {
                    header: 'Formatted Amount',
                    key: 'amount',
                    formatter: (item) => `${item.currency} ${item.amount.toLocaleString()}`
                }
            ];
            const result = generateCSV(data, columns);

            expect(result).toContain('"USD 1,000"');
        });

        it('should handle null and undefined values in data cells by returning empty fields', () => {
            const data = [{ a: null, b: undefined, c: 0 }];
            const columns = [
                { header: 'A', key: 'a' },
                { header: 'B', key: 'b' },
                { header: 'C', key: 'c' }
            ];
            const result = generateCSV(data, columns);
            const lines = result.substring(1).split('\n');

            expect(lines[1]).toBe(',,"0"');
        });
    });

    describe('downloadCSV', () => {
        let createObjectURLSpy;
        let revokeObjectURLSpy;
        let appendChildSpy;
        let removeChildSpy;
        let createElementSpy;

        beforeEach(() => {
            createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:url');
            revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
            appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
            removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});

            // Mock Blob
            global.Blob = vi.fn().mockImplementation((content, options) => ({ content, options }));
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should trigger a download flow', () => {
            const mockLink = {
                setAttribute: vi.fn(),
                style: {},
                click: vi.fn(),
                download: '' // link.download !== undefined check
            };
            createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

            const csvContent = 'test,csv,content';
            const filename = 'test.csv';

            downloadCSV(csvContent, filename);

            expect(global.Blob).toHaveBeenCalledWith([csvContent], { type: 'text/csv;charset=utf-8;' });
            expect(createElementSpy).toHaveBeenCalledWith('a');
            expect(createObjectURLSpy).toHaveBeenCalled();
            expect(mockLink.setAttribute).toHaveBeenCalledWith('href', 'blob:url');
            expect(mockLink.setAttribute).toHaveBeenCalledWith('download', filename);
            expect(appendChildSpy).toHaveBeenCalledWith(mockLink);
            expect(mockLink.click).toHaveBeenCalled();
            expect(removeChildSpy).toHaveBeenCalledWith(mockLink);
            expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:url');
        });

        it('should do nothing if link.download is not supported', () => {
            const mockLink = {
                setAttribute: vi.fn(),
                style: {},
                click: vi.fn()
                // download is undefined
            };
            createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);

            downloadCSV('test', 'test.csv');

            expect(createObjectURLSpy).not.toHaveBeenCalled();
            expect(mockLink.click).not.toHaveBeenCalled();
        });
    });
});
