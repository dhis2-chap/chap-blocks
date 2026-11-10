import { DEFAULT_DHIS2_CALENDAR, getPeriodsInRange } from '@chap-blocks/core';

/** Chap period types, as models declare them in `supportedPeriodType`. */
export type ChapPeriodType = 'day' | 'week' | 'month' | 'year';

export type DetectedPeriod = {
    type: ChapPeriodType;
    /** DHIS2 fixed period id (202401, 2024W5, 20240131, 2024), used for ordering and ranges. */
    id: string;
};

const pad = (value: number) => String(value).padStart(2, '0');

const isValidDate = (year: number, month: number, day: number) => {
    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

/** ISO 8601 years have 53 weeks when they start on a Thursday, or on a Wednesday in a leap year. */
const isoWeeksInYear = (year: number) => {
    const jan1 = new Date(Date.UTC(year, 0, 1)).getUTCDay();
    const leap = isValidDate(year, 2, 29);
    return jan1 === 4 || (leap && jan1 === 3) ? 53 : 52;
};

/**
 * Reads the time_period formats Chap CSVs use: months (2024-01, 202401), ISO weeks
 * (2024-W05, 2024W5), days (2024-01-31) and years (2024). Returns null for anything else.
 */
export const detectPeriod = (raw: string): DetectedPeriod | null => {
    const value = raw.trim();
    let match = value.match(/^(\d{4})-?W(\d{1,2})$/i);
    if (match) {
        const [year, week] = [Number(match[1]), Number(match[2])];
        return week >= 1 && week <= isoWeeksInYear(year) ? { type: 'week', id: `${year}W${week}` } : null;
    }
    match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/) ?? value.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (match) {
        const [year, month, day] = match.slice(1).map(Number);
        return isValidDate(year, month, day) ? { type: 'day', id: `${year}${pad(month)}${pad(day)}` } : null;
    }
    match = value.match(/^(\d{4})-(\d{1,2})$/) ?? value.match(/^(\d{4})(\d{2})$/);
    if (match) {
        const [year, month] = match.slice(1).map(Number);
        return month >= 1 && month <= 12 ? { type: 'month', id: `${year}${pad(month)}` } : null;
    }
    if (/^\d{4}$/.test(value)) return { type: 'year', id: value };
    return null;
};

/** Every period id from the first to the last, inclusive, in order. Empty when the range cannot be built. */
export const getPeriodRange = (start: string, end: string): string[] => {
    try {
        return getPeriodsInRange({ startPeriodId: start, endPeriodId: end, calendar: DEFAULT_DHIS2_CALENDAR })
            .map(period => period.id);
    } catch {
        return [];
    }
};

/** Human-friendly label for a DHIS2 period id: 2024-01, 2024-W05, 2024-01-31, 2024. */
export const formatPeriod = (id: string): string => {
    let match = id.match(/^(\d{4})W(\d{1,2})$/);
    if (match) return `${match[1]}-W${match[2].padStart(2, '0')}`;
    match = id.match(/^(\d{4})(\d{2})(\d{2})$/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    match = id.match(/^(\d{4})(\d{2})$/);
    if (match) return `${match[1]}-${match[2]}`;
    return id;
};
