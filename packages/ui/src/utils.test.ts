import { describe, expect, it } from 'vitest';
import { buildPredictionSeries, OUTBREAK_PROBABILITY_OPTIONS, monitoringSeries } from '@chap-blocks/ui/utils';

describe('public utilities without browser globals', () => {
    it('transforms empty forecasts and monitoring without loading UI components', () => {
        expect(typeof document).toBe('undefined');
        expect(buildPredictionSeries([], new Map(), 'cases', [])).toEqual([]);
        expect(OUTBREAK_PROBABILITY_OPTIONS).toEqual([10, 25, 50, 75, 90]);
        expect(monitoringSeries({ metricId: 'mae', baselineModel: 'baseline', comparisonDescription: '', points: [] }).perRun).toEqual([]);
    });
});
