import { describe, expect, it } from 'vitest';
import type { SelectionBias } from '@chap-blocks/api';
import { selectionBiasSeries } from './selectionBiasSeries';

const data: SelectionBias = {
    metricId: 'crps_log1p',
    baselineModel: 'seasonal_shift_persistence',
    comparisonDescription: 'Relative improvement over the reference.',
    horizonDistance: 1,
    futureSplits: 4,
    splitPeriods: ['202401', '202402', '202403', '202404'],
    candidates: [],
    selectedBacktestId: 1,
    validationValue: 0.2,
    estimatedBias: 0.05,
    estimatedValue: 0.15,
    meanOptimism: 0.08,
    nPairs: 10,
    coefficients: { intercept: 0.02, inverseSqrtK: 0.06, distance: 0.01 },
    windowSizePoints: [{ x: 1, value: 0.09, fitted: 0.08, nPairs: 6 }],
    distancePoints: [{ x: 0, value: 0.04, fitted: 0.05, nPairs: 6 }, { x: 2, value: 0.07, fitted: 0.07, nPairs: 1 }],
};

describe('selectionBiasSeries', () => {
    it('draws the window-size fit up to the full window, where the estimate is read off', () => {
        const series = selectionBiasSeries(data, 'windowSize');
        expect(series.points).toEqual([{ x: 1, y: 0.09, custom: { nPairs: 6 } }]);
        expect(series.fitted.map(point => point.x)).toEqual([1, 2, 3, 4]);
        expect(series.fitted[0].y).toBeCloseTo(0.08);
        expect(series.estimate).toEqual({ x: 4, y: 0.05 });
    });

    it('draws the distance fit over the future splits and marks the estimated bias', () => {
        const series = selectionBiasSeries(data, 'distance');
        expect(series.fitted.map(point => point.x)).toEqual([0, 1, 2, 3]);
        expect(series.fitted[0].y).toBeCloseTo(0.05);
        expect(series.fitted[3].y).toBeCloseTo(0.08);
        expect(series.estimate).toEqual({ x: 1.5, y: 0.05 });
    });
});
