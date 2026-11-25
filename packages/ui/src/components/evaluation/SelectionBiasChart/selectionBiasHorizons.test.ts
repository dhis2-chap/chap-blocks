import { describe, expect, it } from 'vitest';
import { selectionBiasHorizons } from './selectionBiasHorizons';

describe('selectionBiasHorizons', () => {
    it('names a single horizon distance', () => {
        expect(selectionBiasHorizons({ horizonDistances: [1], gapSplits: 0 })).toBe('Scored on forecasts one period ahead only.');
    });

    it('names the range and the gap for several horizon distances', () => {
        const text = selectionBiasHorizons({ horizonDistances: [1, 2, 3], gapSplits: 2 });
        expect(text).toContain('1 to 3 periods ahead');
        expect(text).toContain('start 2 splits after each window');
    });
});
