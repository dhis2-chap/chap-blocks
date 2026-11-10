import i18n from '@dhis2/d2-i18n';
import cx from 'classnames';
import {
    DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow,
} from '@dhis2/ui';
import type { OutbreakMetricInfo, OutbreakMetricsRow } from '@chap-blocks/api';
import styles from './OutbreakMetricsTable.module.css';

const formatScore = (value: number | null | undefined) => (
    value != null && Number.isFinite(value)
        ? value.toLocaleString(undefined, { maximumFractionDigits: 3 })
        : i18n.t('Not defined')
);

const Comparison = ({ value, reference }: { value?: number | null; reference?: number | null }) => {
    if (reference == null || !Number.isFinite(reference)) return null;
    const difference = value != null && Number.isFinite(value) ? value - reference : 0;
    return (
        <span className={cx(styles.comparison, { [styles.better]: difference > 0, [styles.worse]: difference < 0 })}>
            {i18n.t('vs {{reference}}', { reference: formatScore(reference) })}
        </span>
    );
};

const MetricLabel = ({ metric }: { metric: OutbreakMetricInfo }) => (
    <span title={metric.description}>{metric.displayName}</span>
);

export type OutbreakMetricsTableProps = {
    /** One row of Chap's outbreak-metrics response (overall, or one horizon). */
    row: OutbreakMetricsRow;
    /** Chap's outbreak-metric catalog. Binary metrics become columns, categorical ones the policy summary. */
    metrics: OutbreakMetricInfo[];
    /** The same row for a reference model; each score is then compared with it. */
    referenceRow?: OutbreakMetricsRow;
    /** Threshold description per signal level name. */
    thresholds?: Record<string, string>;
};

/** How well a signal policy's levels match observed outbreaks: one row per level, plus whole-policy scores. */
export const OutbreakMetricsTable = ({ row, metrics, referenceRow, thresholds }: OutbreakMetricsTableProps) => {
    const binary = metrics.filter(metric => metric.kind === 'binary');
    const categorical = metrics.filter(metric => metric.kind === 'categorical');
    return (
        <div className={styles.result}>
            <div className={styles.heading}>
                <h3>
                    {row.horizonDistance == null
                        ? i18n.t('All forecast horizons')
                        : i18n.t('Horizon {{horizon}}', { horizon: row.horizonDistance })}
                </h3>
                <span>
                    {row.nCells === 1
                        ? i18n.t('1 forecast case scored')
                        : i18n.t('{{count}} forecast cases scored', { count: row.nCells })}
                </span>
            </div>
            <div className={styles.table}>
                <DataTable>
                    <DataTableHead>
                        <DataTableRow>
                            <DataTableColumnHeader>{i18n.t('Signal level')}</DataTableColumnHeader>
                            {thresholds && <DataTableColumnHeader>{i18n.t('Threshold')}</DataTableColumnHeader>}
                            {binary.map(metric => (
                                <DataTableColumnHeader key={metric.id} align="right"><MetricLabel metric={metric} /></DataTableColumnHeader>
                            ))}
                        </DataTableRow>
                    </DataTableHead>
                    <DataTableBody>
                        {row.levels.map((level) => {
                            const reference = referenceRow?.levels.find(item => item.level === level.level);
                            return (
                                <DataTableRow key={level.level}>
                                    <DataTableCell><strong>{level.level}</strong></DataTableCell>
                                    {thresholds && <DataTableCell className={styles.threshold}>{thresholds[level.level] ?? '—'}</DataTableCell>}
                                    {binary.map(metric => (
                                        <DataTableCell key={metric.id} align="right" className={styles.number}>
                                            {formatScore(level.metrics[metric.id])}
                                            <Comparison value={level.metrics[metric.id]} reference={reference?.metrics[metric.id]} />
                                        </DataTableCell>
                                    ))}
                                </DataTableRow>
                            );
                        })}
                    </DataTableBody>
                </DataTable>
            </div>
            {categorical.length > 0 && (
                <div className={styles.policy}>
                    <strong>{i18n.t('Policy overall')}</strong>
                    {categorical.map(metric => (
                        <span key={metric.id}>
                            <MetricLabel metric={metric} />
                            <strong className={styles.number}>{formatScore(row.categorical[metric.id])}</strong>
                            <Comparison value={row.categorical[metric.id]} reference={referenceRow?.categorical[metric.id]} />
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};
