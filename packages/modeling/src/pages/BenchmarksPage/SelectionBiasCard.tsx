import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import type { BacktestSpecificationRead } from '@chap-blocks/api';
import { SelectionBiasChart } from '@chap-blocks/ui/charts';
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
                {i18n.t('The best model on a benchmark looks better than it will be on new data, because part of its lead is luck. Every window of split points picks its best model, which is then scored on the later splits. The difference, the optimism, is fitted against the window size and the distance to the scored split.')}
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
    const picked = bias.candidates.find(candidate => candidate.backtestId === bias.selectedBacktestId);
    return (
        <>
            {header}
            <dl className={styles.selectionBiasSummary}>
                <div><dt>{i18n.t('Picked model')}</dt><dd>{picked?.modelName ?? `#${bias.selectedBacktestId}`}</dd></div>
                <div><dt>{i18n.t('On the benchmark')}</dt><dd>{format(bias.validationValue)}</dd></div>
                <div><dt>{i18n.t('Estimated bias')}</dt><dd>{format(bias.estimatedBias)}</dd></div>
                <div><dt>{i18n.t('Expected on new data')}</dt><dd>{format(bias.estimatedValue)}</dd></div>
            </dl>
            <p className={styles.caption}>
                {i18n.t('{{metric}} compared with {{baseline}}: {{description}} Bias averaged over the next {{count}} splits, from {{pairs}} window and split pairs.', {
                    metric: metric?.displayName ?? bias.metricId,
                    baseline: bias.baselineModel,
                    description: bias.comparisonDescription,
                    count: bias.futureSplits,
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
