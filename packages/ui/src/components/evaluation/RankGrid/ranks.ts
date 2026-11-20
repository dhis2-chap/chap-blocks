import type { MetricInfo } from '@chap-blocks/api';
import { metricSortKey } from '../BenchmarkTable/benchmarkRanking';

/** Scores by row id, then by column id, e.g. each model's CRPS per year or per org unit. */
export type RankScores = Record<string, Record<string, number | null | undefined>>;

export type RankTable = {
    /** Rank by row id, then by column id: 1 is best, ties share a rank (1, 1, 3). Missing scores have no rank. */
    ranks: Record<string, Record<string, number>>;
    /** How many columns each row ranks first in, ties included. */
    wins: Record<string, number>;
    /** Columns where at least one row has a score. */
    rankedColumns: number;
};

const isNumber = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value);

/** Ranks the rows within each column by the metric's direction and target, as BenchmarkTable does. */
export const rankColumns = (rowIds: string[], columnIds: string[], scores: RankScores, metric?: MetricInfo): RankTable => {
    const ranks: RankTable['ranks'] = Object.fromEntries(rowIds.map(id => [id, {}]));
    const wins: RankTable['wins'] = Object.fromEntries(rowIds.map(id => [id, 0]));
    let rankedColumns = 0;
    for (const column of columnIds) {
        const keys = rowIds.flatMap(row => {
            const value = scores[row]?.[column];
            return isNumber(value) ? [{ row, key: metricSortKey(value, metric) }] : [];
        });
        if (!keys.length) continue;
        rankedColumns += 1;
        for (const { row, key } of keys) {
            const rank = 1 + keys.filter(other => other.key < key - 1e-12).length;
            ranks[row][column] = rank;
            if (rank === 1) wins[row] += 1;
        }
    }
    return { ranks, wins, rankedColumns };
};
