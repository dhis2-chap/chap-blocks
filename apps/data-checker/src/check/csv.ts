export type CsvParseError = {
    /** 1-based line number in the file where the problem starts. */
    line: number;
    message: string;
};

export type CsvRow = {
    /** 1-based line number in the file where the row starts. */
    line: number;
    cells: string[];
};

export type ParsedCsv = {
    header: string[];
    rows: CsvRow[];
    errors: CsvParseError[];
    delimiter: string;
};

const detectDelimiter = (firstLine: string) => {
    const counts = [',', ';', '\t'].map(delimiter => [delimiter, firstLine.split(delimiter).length - 1] as const);
    const [best] = [...counts].sort((a, b) => b[1] - a[1]);
    return best[1] > 0 ? best[0] : ',';
};

/**
 * A small RFC 4180 parser: quoted fields with doubled quotes, embedded delimiters and
 * newlines, CRLF or LF line endings and a UTF-8 byte order mark. Blank lines are skipped.
 * Rows with a different number of cells than the header are reported and left out.
 */
export const parseCsv = (text: string): ParsedCsv => {
    const source = text.replace(/^﻿/, '');
    const delimiter = detectDelimiter(source.slice(0, source.search(/\r?\n|$/)));
    const errors: CsvParseError[] = [];
    const records: CsvRow[] = [];

    let line = 1;
    let recordLine = 1;
    let cells: string[] = [];
    let cell = '';
    let inQuotes = false;
    let quotedCell = false;
    let quoteStartLine = 1;

    const endCell = () => {
        cells.push(quotedCell ? cell : cell.trim());
        cell = '';
        quotedCell = false;
    };
    const endRecord = () => {
        endCell();
        if (cells.length > 1 || cells[0] !== '') records.push({ line: recordLine, cells });
        cells = [];
    };

    for (let i = 0; i < source.length; i++) {
        const char = source[i];
        if (inQuotes) {
            if (char === '"') {
                if (source[i + 1] === '"') {
                    cell += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                if (char === '\n') line++;
                cell += char;
            }
        } else if (char === '"' && cell.trim() === '' && !quotedCell) {
            inQuotes = true;
            quotedCell = true;
            quoteStartLine = line;
            cell = '';
        } else if (char === delimiter) {
            endCell();
        } else if (char === '\n' || char === '\r') {
            if (char === '\r' && source[i + 1] === '\n') i++;
            endRecord();
            line++;
            recordLine = line;
        } else if (quotedCell) {
            // Text after a closing quote, as in "a"b. Keep it, but report it.
            if (char.trim()) {
                errors.push({ line, message: 'Unexpected text after a closing quote.' });
                quotedCell = false;
                cell += char;
            }
        } else {
            cell += char;
        }
    }
    if (inQuotes) {
        errors.push({ line: quoteStartLine, message: 'A quoted value is never closed.' });
    }
    if (cell !== '' || cells.length) endRecord();

    const [headerRecord, ...dataRecords] = records;
    if (!headerRecord) return { header: [], rows: [], errors, delimiter };

    const header = headerRecord.cells;
    const rows: CsvRow[] = [];
    dataRecords.forEach((record) => {
        if (record.cells.length !== header.length) {
            errors.push({
                line: record.line,
                message: `Expected ${header.length} values but found ${record.cells.length}.`,
            });
        } else {
            rows.push(record);
        }
    });
    return { header, rows, errors, delimiter };
};

const MISSING_VALUES = new Set(['', 'na', 'nan', 'null', 'none', 'n/a', '-']);

/** Missing marker → null, number → number, anything else → undefined (not numeric). */
export const parseNumber = (value: string): number | null | undefined => {
    const trimmed = value.trim();
    if (MISSING_VALUES.has(trimmed.toLowerCase())) return null;
    if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(trimmed)) return undefined;
    const number = Number(trimmed);
    return Number.isFinite(number) ? number : undefined;
};
