import { ReactNode, useMemo } from 'react';
import cx from 'classnames';
import i18n from '@dhis2/d2-i18n';
import { DataTable, DataTableBody, DataTableCell, DataTableColumnHeader, DataTableHead, DataTableRow } from '@dhis2/ui';
import type { MetricInfo } from '@chap-blocks/api';
import { createColumnHelper, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table';
import { formatComparison, prettifyMetricId } from '../../../utils/metricFormat';
import { getBestRunIds, metricSortKey } from './benchmarkRanking';
import styles from './BenchmarkTable.module.css';

/** One model run of a benchmark: what its row shows. */
export type BenchmarkTableRun = {
    id: number;
    /** The model's display name. */
    name: string;
    /** Chap's aggregate score per metric id. */
    aggregateMetrics: Record<string, number>;
    /** Chap's comparison with the reference per metric id, oriented so positive is better. */
    comparison?: Record<string, number | null> | null;
    version?: string | null;
};

export type BenchmarkTableProps = {
    runs: BenchmarkTableRun[];
    /** The metric columns, in order. */
    metricIds: string[];
    /** Chap's metric catalog: names, units and which direction is better. Without it no score is highlighted as best. */
    metrics?: MetricInfo[];
    /** When set, metric cells show each run's comparison with this reference; the reference's own run keeps its score. */
    reference?: { name: string; runId?: number };
    /** Shown after each metric's name, for example an info icon. */
    renderMetricInfo?: (metric: MetricInfo | undefined, comparedWith?: string) => ReactNode;
    /** Adds an Actions column. */
    renderActions?: (run: BenchmarkTableRun) => ReactNode;
    /** Show the model version column (default true). */
    showVersion?: boolean;
    /** Sorting before the user sorts by a column; the order of `runs` otherwise. */
    initialSorting?: SortingState;
};

const columnHelper = createColumnHelper<BenchmarkTableRun>();

const isMetricColumn = (id: string) => id.startsWith('metric:');

const finite = (value: number | null | undefined) => typeof value === 'number' && Number.isFinite(value) ? value : undefined;

/** Model runs on one benchmark, one row each, with a column per metric and the best score in each column highlighted. */
export const BenchmarkTable = ({ runs, metricIds, metrics, reference, renderMetricInfo, renderActions, showVersion = true, initialSorting }: BenchmarkTableProps) => {
    const columns = useMemo(() => [
        columnHelper.accessor('name', {
            id: 'model',
            header: i18n.t('Model'),
            cell: info => <span className={styles.strong}>{info.getValue()}</span>,
        }),
        ...metricIds.map((metricId) => {
            const metric = metrics?.find(item => item.id === metricId);
            const bestRunIds = getBestRunIds(runs, metric);
            const label = metric?.displayName || prettifyMetricId(metricId);
            const score = (run: BenchmarkTableRun) => finite(run.aggregateMetrics[metricId]);
            // Comparison values are oriented so positive is better, whatever the metric's own direction.
            return columnHelper.accessor(run => reference ? finite(run.comparison?.[metricId]) : score(run), {
                id: `metric:${metricId}`,
                header: () => (
                    <span className={styles.metricHeader}>
                        {metric?.unit && !reference ? `${label} (${metric.unit})` : label}
                        {renderMetricInfo?.(metric, reference?.name)}
                    </span>
                ),
                sortUndefined: 'last',
                sortingFn: reference
                    ? (a, b, id) => b.getValue<number>(id) - a.getValue<number>(id)
                    : (a, b, id) => metricSortKey(a.getValue<number>(id), metric) - metricSortKey(b.getValue<number>(id), metric),
                cell: (info) => {
                    const run = info.row.original;
                    const best = bestRunIds.has(run.id);
                    // A reference run is not compared with itself, so its row keeps the score the others are compared with.
                    if (reference && run.id === reference.runId) {
                        const referenceScore = score(run);
                        return referenceScore === undefined ? '—' : (
                            <span className={cx(styles.referenceScore, { [styles.best]: best })} title={i18n.t('Score of {{reference}}, which the other rows are compared with', { reference: reference.name })}>
                                {referenceScore.toLocaleString(undefined, { maximumSignificantDigits: 6 })}
                            </span>
                        );
                    }
                    const value = info.getValue();
                    if (value === undefined) return '—';
                    return (
                        <span
                            className={cx({ [styles.better]: reference && value > 0, [styles.worse]: reference && value < 0, [styles.best]: best })}
                            title={best ? i18n.t('Best score among these runs') : undefined}
                        >
                            {reference ? formatComparison(value, metric) : value.toLocaleString(undefined, { maximumSignificantDigits: 6 })}
                        </span>
                    );
                },
            });
        }),
        ...(showVersion ? [columnHelper.accessor(run => run.version ?? undefined, {
            id: 'version',
            header: i18n.t('Version'),
            cell: info => info.getValue() ?? '—',
            sortUndefined: 'last',
        })] : []),
        ...(renderActions ? [columnHelper.display({
            id: 'actions',
            header: i18n.t('Actions'),
            cell: ({ row }) => renderActions(row.original),
        })] : []),
    ], [runs, metricIds, metrics, reference, renderMetricInfo, renderActions, showVersion]);
    const table = useReactTable({
        data: runs,
        columns,
        initialState: { sorting: initialSorting ?? [] },
        enableSortingRemoval: false,
        getRowId: run => String(run.id),
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className={styles.table}>
            <DataTable>
                <DataTableHead>
                    {table.getHeaderGroups().map(group => (
                        <DataTableRow key={group.id}>
                            {group.headers.map(header => (
                                <DataTableColumnHeader
                                    key={header.id}
                                    className={header.column.id === 'model' ? styles.sticky : undefined}
                                    {...(header.column.getCanSort() ? {
                                        sortDirection: header.column.getIsSorted() || 'default',
                                        sortIconTitle: i18n.t('Sort by {{column}}', { column: header.column.id }),
                                        onSortIconClick: () => header.column.toggleSorting(),
                                    } : {})}
                                >
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </DataTableColumnHeader>
                            ))}
                        </DataTableRow>
                    ))}
                </DataTableHead>
                <DataTableBody>
                    {table.getRowModel().rows.map(row => (
                        <DataTableRow key={row.id}>
                            {row.getVisibleCells().map(cell => (
                                <DataTableCell
                                    key={cell.id}
                                    className={isMetricColumn(cell.column.id) ? styles.number : cell.column.id === 'model' ? styles.sticky : undefined}
                                >
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </DataTableCell>
                            ))}
                        </DataTableRow>
                    ))}
                </DataTableBody>
            </DataTable>
        </div>
    );
};
