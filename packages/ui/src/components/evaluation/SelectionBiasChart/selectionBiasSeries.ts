import type { SelectionBias } from '@chap-blocks/api';

export type SelectionBiasAxis = 'windowSize' | 'distance';

export type SelectionBiasSeriesPoint = { x: number; y: number; custom?: { nPairs: number } };

export type SelectionBiasSeries = {
    /** Mean gap at each x; on the distance axis adjusted to the full window size. */
    points: SelectionBiasSeriesPoint[];
    /** The fitted line, one point per whole x. */
    fitted: SelectionBiasSeriesPoint[];
    /** Where the estimated bias is read off: the full window size. Only on the window-size axis. */
    estimate?: SelectionBiasSeriesPoint;
};

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

/**
 * Scatter and fitted line of a selection-bias response along one axis.
 *
 * The gap between the final pick and a window's pick is fitted as inverseSqrtK / sqrt(k). On the
 * window-size axis the line runs from 1 to the number of split points, where the final pick's
 * window lies and the estimate is read off. On the distance axis the line is flat at the
 * estimated bias: the gap should not change with the distance, so the points are a check.
 */
export const selectionBiasSeries = (selectionBias: SelectionBias, axis: SelectionBiasAxis): SelectionBiasSeries => {
    const { inverseSqrtK } = selectionBias.coefficients;
    const n = selectionBias.splitPeriods.length;
    const source = axis === 'windowSize' ? selectionBias.windowSizePoints : selectionBias.distancePoints;
    const points = source.map(point => ({ x: point.x, y: point.value, custom: { nPairs: point.nPairs } }));
    const line = (k: number) => inverseSqrtK / Math.sqrt(k);
    if (axis === 'windowSize') {
        return { points, fitted: range(1, n).map(k => ({ x: k, y: line(k) })), estimate: { x: n, y: line(n) } };
    }
    const lastDistance = Math.max(0, ...source.map(point => point.x));
    return { points, fitted: range(0, lastDistance).map(d => ({ x: d, y: line(n) })) };
};
