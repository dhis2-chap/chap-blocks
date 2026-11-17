import { useChapClient } from '@chap-blocks/runtime';
import { ReactNode, useCallback, useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Button, Checkbox, MenuItem, NoticeBox, SingleSelect, Tooltip } from '@dhis2/ui';
import type { LeaderboardBacktestRead, BacktestSpecificationRead, MetricInfo } from '@chap-blocks/api';
import { BenchmarkTable as BenchmarkScoresTable, type BenchmarkTableRun } from '@chap-blocks/ui/tables';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { saveAs } from 'file-saver';
import { TableActionButton } from '../../components/TableActionButton';
import { useModels } from '../../hooks/useModels';
import { benchmarkCsv, getMetricIds } from './benchmarkUtils';
import { getDefaultMetricIds } from '../../components/PageContent/EvaluationDetails/EvaluationMetricsWidget/metricCatalog';
import { MetricInfoIcon } from '../../components/MetricInfoIcon/MetricInfoIcon';
import { getComparison, referenceLabel, referenceName, useReferenceModel } from '../../components/ModelComparisons/referenceModels';
import styles from './BenchmarksPage.module.css';

/* The display name and the comparison with the selected reference are resolved into the row, because the table caches row values until the data changes. */
type BenchmarkRun = BenchmarkTableRun & { run: LeaderboardBacktestRead };

type Props = {
    specification: BacktestSpecificationRead;
    /* Filters and status, shown with the comparison controls. */
    options?: ReactNode;
    /* Buttons, shown on the right. */
    actions?: ReactNode;
    children?: ReactNode;
};

const ViewEvaluationButton = ({ evaluationId }: { evaluationId: number }) => {
    const navigate = useNavigate();
    return (
        <TableActionButton dataTest={`view-evaluation-${evaluationId}`} onClick={() => navigate(`/evaluate/${evaluationId}`)}>
            {i18n.t('View evaluation')}
        </TableActionButton>
    );
};

export const BenchmarkTable = ({ specification, options, actions, children }: Props) => {
    const chapClient = useChapClient();
    const { backtests } = specification;
    const evaluationId = backtests[0]?.id;
    // Chap Core 2.6 lists the configured metrics with the specification; older versions need the catalog.
    const catalog = useQuery({
        queryKey: ['evaluation-metric-catalog', evaluationId],
        queryFn: () => chapClient.visualizations.getAvailableMetricsV1VisualizationMetricsBacktestIdGet(evaluationId!),
        enabled: evaluationId != null && !specification.metrics,
        staleTime: 5 * 60 * 1000,
    });
    const metrics = specification.metrics ?? catalog.data;
    const [showAllMetrics, setShowAllMetrics] = useState(false);
    const allMetricIds = useMemo(() => getMetricIds(backtests, metrics), [backtests, metrics]);
    // Older Chap Core versions have no selected metrics, so keep showing every column there.
    const defaultMetricIds = useMemo(() => specification.metrics ? getDefaultMetricIds(allMetricIds, specification.metrics) : allMetricIds, [allMetricIds, specification.metrics]);
    const metricIds = showAllMetrics || !defaultMetricIds.length ? allMetricIds : defaultMetricIds;
    // Runs keep pointing at archived models, so resolve names against all of them.
    const { models } = useModels({ includeArchived: true });
    const [comparing, setComparing] = useState(false);
    const { references, reference: selectedReference, select } = useReferenceModel(specification);
    const reference = comparing ? selectedReference : undefined;
    // Newest runs first until the user sorts by a column. Baselines are only shown as the reference to compare with.
    const runs = useMemo<BenchmarkRun[]>(() => backtests
        .map(run => ({
            run,
            id: run.id,
            aggregateMetrics: run.aggregateMetrics,
            version: run.modelTemplateVersion,
            name: models?.find(model => model.id === run.configuredModel?.id)?.displayName || run.configuredModel?.name || run.modelId,
            comparison: getComparison(run, reference),
        }))
        .sort((a, b) => (b.run.created ?? '').localeCompare(a.run.created ?? '')), [backtests, models, reference]);
    const renderMetricInfo = useCallback((metric: MetricInfo | undefined, comparedWith?: string) => <MetricInfoIcon metric={metric} comparedWith={comparedWith} />, []);
    const renderActions = useCallback((run: BenchmarkTableRun) => <ViewEvaluationButton evaluationId={run.id} />, []);
    const referenceRun = useMemo(() => reference && { name: referenceName(reference), runId: reference.backtestId ?? undefined }, [reference]);
    const referenceSelect = selectedReference && (
        <SingleSelect dense disabled={!comparing} selected={String(selectedReference.configuredModel.id)} onChange={({ selected }) => select(selected)}>
            {references.map(item => (
                <MenuItem key={item.configuredModel.id} value={String(item.configuredModel.id)} label={referenceLabel(item)} />
            ))}
        </SingleSelect>
    );

    return (
        <>
            <div>
                <h2 className={styles.cardTitle}>{i18n.t('Benchmarks')}</h2>
                <p className={styles.caption}>
                    {reference
                        ? i18n.t('Scores compared with {{reference}}, aggregated across all splits and organisation units. Positive means better than {{reference}}, negative means worse. The best score in each column is highlighted, including ties.', { reference: referenceName(reference) })
                        : i18n.t('Aggregate scores across all splits and organisation units. The best score in each column is highlighted, including ties. Best only means best among these runs, not necessarily a good score.')}
                </p>
            </div>
            <div className={styles.toolbar}>
                <div className={styles.actions}>
                    {referenceSelect && (
                        <>
                            <Checkbox
                                dense
                                label={i18n.t('Compare with baseline')}
                                checked={comparing}
                                onChange={({ checked }) => setComparing(checked)}
                            />
                            {comparing ? referenceSelect : (
                                <Tooltip content={i18n.t('Tick Compare with baseline to choose the reference.')}>
                                    {referenceSelect}
                                </Tooltip>
                            )}
                        </>
                    )}
                    {options}
                </div>
                <div className={styles.actions}>
                    {actions}
                    {defaultMetricIds.length > 0 && defaultMetricIds.length < allMetricIds.length && (
                        <Button small onClick={() => setShowAllMetrics(!showAllMetrics)}>
                            {showAllMetrics ? i18n.t('Show default metrics') : i18n.t('Show all {{count}} metrics', { count: allMetricIds.length })}
                        </Button>
                    )}
                    <Button
                        small
                        disabled={!backtests.length}
                        onClick={() => saveAs(
                            new Blob([benchmarkCsv(specification, runs.map(row => row.run))], { type: 'text/csv;charset=utf-8' }),
                            `benchmark-${specification.id}.csv`,
                        )}
                    >
                        {i18n.t('Download CSV')}
                    </Button>
                </div>
            </div>
            {children}
            {catalog.isError && (
                <NoticeBox warning title={i18n.t('Metric descriptions unavailable')}>
                    {i18n.t('Scores are still available, but best values cannot be highlighted without metric definitions.')}
                </NoticeBox>
            )}
            {!backtests.length ? (
                <NoticeBox title={i18n.t('No model runs yet')}>
                    {i18n.t('Add models to run them against this benchmark. Completed runs will appear here.')}
                </NoticeBox>
            ) : (
                <BenchmarkScoresTable
                    runs={runs}
                    metricIds={metricIds}
                    metrics={metrics}
                    reference={referenceRun}
                    renderMetricInfo={renderMetricInfo}
                    renderActions={renderActions}
                />
            )}
        </>
    );
};
