import type { MetricInfo } from '@chap-blocks/api';

/* Keep scores readable while metadata is loading or unavailable. */
export const prettifyMetricId = (metricId: string) =>
    metricId.replace(/_/g, ' ').replace(/^./, char => char.toUpperCase());

/* Significant digits alone would print floating point noise like 4e-17 with seventeen decimals. `|| 0` drops the sign of a rounded -0. */
const MAX_DECIMALS = 6;
const limitDecimals = (value: number) => Math.round(value * 10 ** MAX_DECIMALS) / 10 ** MAX_DECIMALS || 0;
/* A comparison against a near-zero reference can run to twenty digits, so huge values switch to E notation. */
const notation = (value: number) => (Math.abs(value) >= 1e6 ? 'scientific' : 'standard');

export const formatScore = (score: number, unit?: string | null) => {
    /* Scores below 1 keep significant digits so small errors stay distinguishable instead of rounding to zero. */
    const formatted = Math.abs(score) >= 1
        ? score.toLocaleString(undefined, { maximumFractionDigits: 2, notation: notation(score) })
        : limitDecimals(score).toLocaleString(undefined, { maximumSignificantDigits: 3 });
    return unit ? `${formatted} ${unit}` : formatted;
};

/* Comparison values are signed because Chap Core orients every operator so positive means better than the reference. */
export const formatComparison = (value: number, metric?: MetricInfo) => {
    if (metric?.comparisonOp === 'skill_ratio') {
        return value.toLocaleString(undefined, { style: 'percent', maximumSignificantDigits: 3, signDisplay: 'exceptZero', notation: notation(value) });
    }
    const formatted = limitDecimals(value).toLocaleString(undefined, { maximumSignificantDigits: 3, signDisplay: 'exceptZero', notation: notation(value) });
    return metric?.unit ? `${formatted} ${metric.unit}` : formatted;
};
