import type { MetricInfo } from '@chap-blocks/api';

type Scored = { id: number; aggregateMetrics: Record<string, number> };

/** Lower rank is better. Unknown metrics are deliberately not ranked. */
const metricRank = (value: number, metric?: MetricInfo): number | undefined => {
    if (!Number.isFinite(value) || !metric) return undefined;
    if (metric.target != null) {
        return metric.targetBehavior === 'at_least'
            ? Math.max(0, metric.target - value)
            : Math.abs(value - metric.target);
    }
    if (metric.optimizationDirection === 'minimize') return value;
    if (metric.optimizationDirection === 'maximize') return -value;
    return undefined;
};

/** Ascending order puts the best score first; unranked metrics fall back to the raw score. */
export const metricSortKey = (value: number, metric?: MetricInfo) => metricRank(value, metric) ?? value;

/** The runs with the best score for the metric, ties included. Empty when the metric's direction is unknown. */
export const getBestRunIds = (runs: Scored[], metric?: MetricInfo): Set<number> => {
    if (!metric) return new Set();
    const ranks = runs.flatMap((run) => {
        const rank = metricRank(run.aggregateMetrics[metric.id], metric);
        return rank === undefined ? [] : [{ id: run.id, rank }];
    });
    const best = ranks.reduce((minimum, { rank }) => Math.min(minimum, rank), Infinity);
    return new Set(ranks.filter(({ rank }) => Math.abs(rank - best) <= 1e-12).map(({ id }) => id));
};
