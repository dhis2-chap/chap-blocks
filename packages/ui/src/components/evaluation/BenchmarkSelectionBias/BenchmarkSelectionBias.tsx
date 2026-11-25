import type { ReactNode } from 'react';
import i18n from '@dhis2/d2-i18n';
import type { SelectionBias } from '@chap-blocks/api';
import { BenchmarkTable, type BenchmarkTableProps } from '../BenchmarkTable/BenchmarkTable';
import { SelectionBiasChart } from '../SelectionBiasChart/SelectionBiasChart';
import { selectionBiasHorizons } from '../SelectionBiasChart/selectionBiasHorizons';
import { formatComparison } from '../../../utils/metricFormat';
import { selectionBiasSummary } from './selectionBiasSummary';
import styles from './BenchmarkSelectionBias.module.css';

export type SelectionBiasCharts = 'none' | 'windowSize' | 'distance' | 'both';

export type SelectionBiasSummaryProps = {
    /** Response of Chap's backtest-specification selection-bias endpoint. */
    selectionBias: SelectionBias;
    /** Display name of the picked model; defaults to the candidate's model name in the response. */
    pickedName?: string;
    /** Formats a comparison value; defaults to the metric's own format, a percentage for skill ratios. */
    formatValue?: (value: number) => string;
};

/** Picked model, its value on the benchmark, the estimated bias and the value to expect on new data. */
export const SelectionBiasSummary = ({ selectionBias, pickedName, formatValue = value => formatComparison(value) }: SelectionBiasSummaryProps) => {
    const summary = selectionBiasSummary(selectionBias, pickedName);
    return (
        <dl className={styles.summary}>
            <div><dt>{i18n.t('Picked model')}</dt><dd>{summary.pickedName ?? `#${selectionBias.selectedBacktestId}`}</dd></div>
            <div><dt>{i18n.t('On the benchmark')}</dt><dd>{formatValue(summary.validationValue)}</dd></div>
            <div><dt>{i18n.t('Estimated bias')}</dt><dd>{formatValue(summary.estimatedBias)}</dd></div>
            <div className={styles.expected}><dt>{i18n.t('Expected on new data')}</dt><dd>{formatValue(summary.estimatedValue)}</dd></div>
        </dl>
    );
};

export type BenchmarkSelectionBiasProps = BenchmarkTableProps & {
    /** Response of the selection-bias endpoint. Without it only the table is shown, with `selectionBiasNotice` if set. */
    selectionBias?: SelectionBias | null;
    /** Shown in place of the selection bias, for example while it loads or when Chap says what is missing. */
    selectionBiasNotice?: ReactNode;
    /** Which selection-bias plots to show under the summary. Default 'none'. */
    charts?: SelectionBiasCharts;
    /** Display name of the picked model; defaults to the candidate's model name in the response. */
    pickedName?: string;
    /** Formats comparison values in the summary and on the plots. Defaults to the format of the response's metric. */
    formatValue?: (value: number) => string;
    /** Height of each plot in pixels. Default 300. */
    chartHeight?: number;
};

/**
 * A benchmark's model runs with the selection bias of the best one: the benchmark table, then how much picking the
 * best run flatters it and what to expect on new data, then optionally the plots the estimate is read off.
 */
export const BenchmarkSelectionBias = ({
    selectionBias, selectionBiasNotice, charts = 'none', pickedName, formatValue, chartHeight, ...table
}: BenchmarkSelectionBiasProps) => {
    const metric = selectionBias ? table.metrics?.find(item => item.id === selectionBias.metricId) : undefined;
    const format = formatValue ?? ((value: number) => formatComparison(value, metric));
    const axes = charts === 'both' ? (['windowSize', 'distance'] as const) : charts === 'none' ? [] : [charts];
    return (
        <div className={styles.stack}>
            <BenchmarkTable {...table} />
            {selectionBias ? (
                <section aria-label={i18n.t('Selection bias')}>
                    <h3 className={styles.title}>{i18n.t('Selection bias')}</h3>
                    <SelectionBiasSummary selectionBias={selectionBias} pickedName={pickedName} formatValue={format} />
                    <p className={styles.caption}>
                        {i18n.t('{{metric}} compared with {{baseline}}. The bias is how much of the picked model’s lead is expected to be luck: {{other}} of {{windows}} windows of split points picked another model, and it did worse on the later splits.', {
                            metric: metric?.displayName ?? selectionBias.metricId,
                            baseline: selectionBias.baselineModel,
                            other: selectionBias.nWindowsOtherPick,
                            windows: selectionBias.nWindows,
                        })}{' '}
                        {selectionBiasHorizons(selectionBias)}
                    </p>
                    {axes.length > 0 && (
                        <div className={styles.charts}>
                            {axes.map(axis => <SelectionBiasChart key={axis} selectionBias={selectionBias} axis={axis} formatValue={format} height={chartHeight} />)}
                        </div>
                    )}
                </section>
            ) : selectionBiasNotice}
        </div>
    );
};
