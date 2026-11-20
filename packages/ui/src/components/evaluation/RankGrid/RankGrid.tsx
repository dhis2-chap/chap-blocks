import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import type { MetricInfo } from '@chap-blocks/api';
import { formatScore } from '../../../utils/metricFormat';
import { rankColumns, type RankScores } from './ranks';
import styles from './RankGrid.module.css';

export type RankGridItem = { id: string; label: string };

export type RankGridProps = {
    /** The things ranked, one per row, e.g. configured models. */
    rows: RankGridItem[];
    /** What they are ranked in, one per column, e.g. years or org units. */
    columns: RankGridItem[];
    scores: RankScores;
    /** Direction and target decide which score ranks first. Without it lower is better. */
    metric?: MetricInfo;
    /** Ids of rows to set apart, e.g. baselines. */
    highlightRows?: string[];
    /** Heading of the row label column. */
    rowLabel?: string;
};

const SHADES = 4;

/**
 * Each row's rank in each column, with rank 1 filled, and how many columns each row wins. Shows whether the best model
 * overall is best in most years and places, or only on average.
 */
export const RankGrid = ({ rows, columns, scores, metric, highlightRows = [], rowLabel = i18n.t('Model') }: RankGridProps) => {
    const table = useMemo(
        () => rankColumns(rows.map(row => row.id), columns.map(column => column.id), scores, metric),
        [rows, columns, scores, metric],
    );
    const highlighted = new Set(highlightRows);
    const shade = (rank: number) => styles[`rank${Math.min(rank, SHADES)}`];

    return (
        <div className={styles.scroll}>
            <table className={styles.grid}>
                <thead>
                    <tr>
                        <th scope="col" className={styles.rowHead}>{rowLabel}</th>
                        {columns.map(column => <th key={column.id} scope="col" className={styles.column}>{column.label}</th>)}
                        <th scope="col" className={styles.wins}>{i18n.t('Ranked first')}</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(row => {
                        const wins = table.wins[row.id] ?? 0;
                        return (
                            <tr key={row.id}>
                                <th scope="row" className={`${styles.rowHead} ${highlighted.has(row.id) ? styles.highlighted : ''}`}>{row.label}</th>
                                {columns.map(column => {
                                    const rank = table.ranks[row.id]?.[column.id];
                                    const score = scores[row.id]?.[column.id];
                                    return (
                                        <td key={column.id} className={`${styles.cell} ${rank ? shade(rank) : styles.missing}`}
                                            title={rank && typeof score === 'number'
                                                ? i18n.t('{{row}}, {{column}}: rank {{rank}} of {{count}} ({{score}})', {
                                                    row: row.label, column: column.label, rank, count: rows.length, score: formatScore(score, metric?.unit),
                                                })
                                                : i18n.t('{{row}}, {{column}}: no score', { row: row.label, column: column.label })}>
                                            {rank ?? '–'}
                                        </td>
                                    );
                                })}
                                <td className={styles.wins}>
                                    <span className={styles.track}>
                                        <span className={styles.bar} style={{ width: `${table.rankedColumns ? (wins / table.rankedColumns) * 100 : 0}%` }} />
                                    </span>
                                    <span className={styles.count}>{i18n.t('{{wins}} of {{count}}', { wins, count: table.rankedColumns })}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};
