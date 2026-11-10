import { describe, expect, it } from 'vitest';
import { getEqualIntervals } from './utils';

describe('getEqualIntervals', () => {
    it('covers the exact minimum and maximum of fractional data', () => {
        const bins = getEqualIntervals(0.6, 2.4);
        expect(bins[0].startValue).toBe(0.6);
        expect(bins.at(-1)!.endValue).toBe(2.4);
    });

    it('places every value in a bin, with shared edges between bins', () => {
        const bins = getEqualIntervals(0.1, 0.7, 3);
        for (let i = 1; i < bins.length; i++) expect(bins[i].startValue).toBe(bins[i - 1].endValue);
        for (const value of [0.1, 0.3, 0.30000000000000004, 0.5, 0.7])
            expect(bins.some(bin => value >= bin.startValue && value <= bin.endValue), String(value)).toBe(true);
    });
});
