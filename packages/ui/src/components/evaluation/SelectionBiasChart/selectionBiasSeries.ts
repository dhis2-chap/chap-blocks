import type { SelectionBias } from '@chap-blocks/api';

export type SelectionBiasAxis = 'windowSize' | 'distance';

export type SelectionBiasSeriesPoint = { x: number; y: number; custom?: { nPairs: number } };

export type SelectionBiasSeries = {
    /** Mean optimism at each x, adjusted to distance 0 (window size) or the full window (distance). */
    points: SelectionBiasSeriesPoint[];
    /** The fitted line, one point per whole x. */
    fitted: SelectionBiasSeriesPoint[];
    /** Where the estimate is read off: the full window size, or the mean over the next splits. */
    estimate: SelectionBiasSeriesPoint;
};

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * Scatter and fitted line of a selection-bias response along one axis.
 *
 * On the window-size axis the line runs from 1 to the number of split points, where the
 * final pick's window lies, and the estimate is the fit there at distance 0. On the distance
 * axis the line covers the measured distances and the future splits the bias is averaged
 * over, and the estimate is the response's estimated bias at the middle of those splits.
 */
export const selectionBiasSeries = (selectionBias: SelectionBias, axis: SelectionBiasAxis): SelectionBiasSeries => {
    const { intercept, inverseSqrtK, distance } = selectionBias.coefficients;
    const n = selectionBias.splitPeriods.length;
    const source = axis === 'windowSize' ? selectionBias.windowSizePoints : selectionBias.distancePoints;
    const points = source.map(point => ({ x: point.x, y: point.value, custom: { nPairs: point.nPairs } }));
    if (axis === 'windowSize') {
        const line = (k: number) => intercept + inverseSqrtK / Math.sqrt(k);
        return { points, fitted: range(1, n).map(k => ({ x: k, y: line(k) })), estimate: { x: n, y: line(n) } };
    }
    const lastDistance = Math.max(selectionBias.futureSplits - 1, ...source.map(point => point.x));
    const line = (d: number) => intercept + inverseSqrtK / Math.sqrt(n) + distance * d;
    return {
        points,
        fitted: range(0, lastDistance).map(d => ({ x: d, y: line(d) })),
        estimate: { x: (selectionBias.futureSplits - 1) / 2, y: selectionBias.estimatedBias },
    };
};
