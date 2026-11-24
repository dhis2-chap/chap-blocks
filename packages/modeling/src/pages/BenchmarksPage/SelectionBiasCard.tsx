import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import type { BacktestSpecificationRead } from '@chap-blocks/api';
import { SelectionBiasChart } from '@chap-blocks/ui/charts';
import { SelectionBiasSummary } from '@chap-blocks/ui/tables';
import { formatComparison } from '@chap-blocks/ui/metrics';
import { ChapErrorNotice } from '../../components/ChapErrorNotice';
import { useSelectionBias } from './useSelectionBias';
import styles from './BenchmarksPage.module.css';

type Props = { specification: BacktestSpecificationRead };

/** How much picking the best model on this benchmark flatters it, estimated from the benchmark's own split points. */
export const SelectionBiasCard = ({ specification }: Props) => {
    const query = useSelectionBias(specification.id, specification.backtests.map(backtest => backtest.id));
    const header = (
        <div>
            <h3 className={styles.cardTitle}>{i18n.t('Selection bias')}</h3>
            <p className={styles.caption}>
                {i18n.t('The best model on a benchmark looks better than it will be on new data, because part of its lead is luck. Every window of split points picks its best model. On the later splits, that pick is compared with the model picked on all splits; the gap is zero when the window picks the same model. The gap is fitted against the window size and read off for all split points.')}
            </p>
        </div>
    );
    if (query.isLoading) return <>{header}<div className={styles.loading}><CircularLoader small /></div></>;
    if (query.error) {
        // 422: not enough models, split points or baseline results on this benchmark yet.
        const detail = (query.error.body as { detail?: unknown } | undefined)?.detail;
        if (query.error.status === 422 && typeof detail === 'string') {
            return <>{header}<NoticeBox title={i18n.t('Selection bias is not available')}>{detail}</NoticeBox></>;
        }
        return <>{header}<ChapErrorNotice error={query.error} title={i18n.t('Could not estimate the selection bias')} /></>;
    }
    if (!query.data) return null;
    const bias = query.data;
    const metric = specification.metrics?.find(info => info.id === bias.metricId);
    const format = (value: number) => formatComparison(value, metric);
    return (
        <>
            {header}
            <SelectionBiasSummary selectionBias={bias} formatValue={format} />
            <p className={styles.caption}>
                {i18n.t('{{metric}} compared with {{baseline}}: {{description}} {{other}} of {{windows}} windows of split points picked another model, from {{pairs}} window and split pairs.', {
                    metric: metric?.displayName ?? bias.metricId,
                    baseline: bias.baselineModel,
                    description: bias.comparisonDescription,
                    other: bias.nWindowsOtherPick,
                    windows: bias.nWindows,
                    pairs: bias.nPairs,
                })}
            </p>
            <div className={styles.selectionBiasCharts}>
                <SelectionBiasChart selectionBias={bias} axis="windowSize" formatValue={format} />
                <SelectionBiasChart selectionBias={bias} axis="distance" formatValue={format} />
            </div>
        </>
    );
};
