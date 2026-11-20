import { canonicalizePeriodId } from '@chap-blocks/core';
import type { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';

export type ForecastHit = {
    period: string;
    observed: number | null;
    /** Whether the observed value is inside the outer band (quantile_low to quantile_high); null when nothing was observed. */
    inside: boolean | null;
    /** Absolute distance from the median to the observed value: the error MAE averages. */
    error: number | null;
};

export type ForecastHitSummary = {
    points: ForecastHit[];
    /** Forecast periods with an observed value. */
    scored: number;
    hits: number;
    /** Share of scored periods inside the outer band; null when none were scored. */
    coverage: number | null;
    /** Mean absolute error of the median; null when none were scored. */
    mae: number | null;
};

const isNumber = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value);

/** Compares each forecast period with what was observed: inside the outer band or not, and how far from the median. */
export const forecastHits = (series: PredictionOrgUnitSeries): ForecastHitSummary => {
    const observedByPeriod = new Map(series.actualCases?.map(point => [canonicalizePeriodId(point.period), point.value]) ?? []);
    const points = series.points.map((point): ForecastHit => {
        const observed = observedByPeriod.get(canonicalizePeriodId(point.period));
        if (!isNumber(observed)) return { period: point.period, observed: null, inside: null, error: null };
        const { quantile_low: low, quantile_high: high, median } = point.quantiles;
        return {
            period: point.period,
            observed,
            inside: isNumber(low) && isNumber(high) ? observed >= low && observed <= high : null,
            error: isNumber(median) ? Math.abs(observed - median) : null,
        };
    });
    const banded = points.filter(point => point.inside !== null);
    const errors = points.flatMap(point => (point.error === null ? [] : [point.error]));
    const hits = banded.filter(point => point.inside).length;
    return {
        points,
        scored: banded.length,
        hits,
        coverage: banded.length ? hits / banded.length : null,
        mae: errors.length ? errors.reduce((sum, error) => sum + error, 0) / errors.length : null,
    };
};
