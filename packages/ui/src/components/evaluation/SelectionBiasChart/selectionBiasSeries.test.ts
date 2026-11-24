import { describe, expect, it } from 'vitest';
import type { SelectionBias } from '@chap-blocks/api';
import { selectionBiasSeries } from './selectionBiasSeries';

const data: SelectionBias = {
    metricId: 'crps_log1p',
    baselineModel: 'seasonal_shift_persistence',
    comparisonDescription: 'Relative improvement over the reference.',
    horizonDistance: 1,
    splitPeriods: ['202401', '202402', '202403', '202404'],
    candidates: [],
    selectedBacktestId: 1,
    validationValue: 0.2,
    estimatedBias: 0.03,
    estimatedValue: 0.17,
    meanGap: 0.05,
    nPairs: 10,
    nWindows: 6,
    nWindowsOtherPick: 2,
    coefficients: { inverseSqrtK: 0.06 },
    windowSizePoints: [{ x: 1, value: 0.07, fitted: 0.06, nPairs: 6 }],
    distancePoints: [{ x: 0, value: 0.02, fitted: 0.03, nPairs: 6 }, { x: 2, value: 0.04, fitted: 0.03, nPairs: 1 }],
};

describe('selectionBiasSeries', () => {
    it('draws the window-size fit up to the full window, where the estimate is read off', () => {
        const series = selectionBiasSeries(data, 'windowSize');
        expect(series.points).toEqual([{ x: 1, y: 0.07, custom: { nPairs: 6 } }]);
        expect(series.fitted.map(point => point.x)).toEqual([1, 2, 3, 4]);
        expect(series.fitted[0].y).toBeCloseTo(0.06);
        expect(series.estimate?.x).toBe(4);
        expect(series.estimate?.y).toBeCloseTo(0.03);
    });

    it('draws the distance check as a flat line at the estimated bias, without an estimate point', () => {
        const series = selectionBiasSeries(data, 'distance');
        expect(series.fitted.map(point => point.x)).toEqual([0, 1, 2]);
        expect(series.fitted.every(point => Math.abs(point.y - 0.03) < 1e-9)).toBe(true);
        expect(series.estimate).toBeUndefined();
    });
});
