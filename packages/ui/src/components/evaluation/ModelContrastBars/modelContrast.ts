import type { MetricInfo } from '@chap-blocks/api';
import { metricSortKey } from '../BenchmarkTable/benchmarkRanking';

export type ModelContrastRow = {
    id: string;
    label: string;
    /** The first model's score, e.g. its CRPS in one org unit. */
    a: number | null;
    /** The second model's score on the same metric and row. */
    b: number | null;
};

export type ScoredContrastRow = ModelContrastRow & {
    /** How much better the first model scores: positive favours the first model, negative the second, 0 a tie. */
    gap: number;
};

export type ModelContrast = {
    rows: ScoredContrastRow[];
    /** Rows where each model scores better; ties count for neither. */
    winsA: number;
    winsB: number;
};

const isNumber = (value: number | null): value is number => value !== null && Number.isFinite(value);

/**
 * Scores two models row by row on one metric and sorts the rows by how much they differ, largest first. The metric's
 * direction and target decide what "better" means, as in BenchmarkTable; rows missing either score are left out.
 */
export const contrastModels = (rows: ModelContrastRow[], metric?: MetricInfo): ModelContrast => {
    const scored = rows.flatMap(row => (isNumber(row.a) && isNumber(row.b)
        ? [{ ...row, gap: metricSortKey(row.b, metric) - metricSortKey(row.a, metric) }]
        : []))
        .sort((first, second) => Math.abs(second.gap) - Math.abs(first.gap));
    return {
        rows: scored,
        winsA: scored.filter(row => row.gap > 0).length,
        winsB: scored.filter(row => row.gap < 0).length,
    };
};
