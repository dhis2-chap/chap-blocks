import i18n from '@dhis2/d2-i18n';
import { colors } from '@dhis2/ui';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { SelectionBias } from '@chap-blocks/api';
import { escapeHtml } from '../../../utils/escapeHtml';
import { selectionBiasSeries, type SelectionBiasAxis } from './selectionBiasSeries';

const defaultFormat = (value: number) => value.toLocaleString(undefined, { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });

export type SelectionBiasChartProps = {
    /** Response of Chap's backtest-specification selection-bias endpoint. */
    selectionBias: SelectionBias;
    /** Plot the optimism against the validation window size or against the distance to the test split. */
    axis: SelectionBiasAxis;
    /** Formats an optimism value, e.g. as a percentage for skill ratios. */
    formatValue?: (value: number) => string;
    height?: number;
};

/**
 * How much the validation score flatters the picked model, against the validation window size
 * or the distance to the test split: the measured means as points, the fitted line through
 * them, and the point the estimated bias is read off.
 */
export const SelectionBiasChart = ({ selectionBias, axis, formatValue = defaultFormat, height = 300 }: SelectionBiasChartProps) => {
    const series = selectionBiasSeries(selectionBias, axis);
    const n = selectionBias.splitPeriods.length;
    const windowSize = axis === 'windowSize';
    const estimateName = windowSize
        ? i18n.t('Final pick ({{count}} splits)', { count: n })
        : i18n.t('Estimated bias over the next {{count}} splits', { count: selectionBias.futureSplits });
    const maxPairs = Math.max(1, ...series.points.map(point => point.custom?.nPairs ?? 1));
    const options: Highcharts.Options = {
        chart: { height, style: { fontFamily: 'inherit' } },
        title: { text: undefined },
        exporting: { enabled: false },
        credits: { enabled: false },
        xAxis: {
            title: { text: escapeHtml(windowSize ? i18n.t('Validation window size k (splits)') : i18n.t('Distance d after the validation window (splits)')) },
            allowDecimals: false,
            plotBands: windowSize ? undefined : [{
                from: -0.5,
                to: selectionBias.futureSplits - 0.5,
                color: colors.grey100,
                label: { text: escapeHtml(i18n.t('Next {{count}} splits', { count: selectionBias.futureSplits })), style: { color: colors.grey700 } },
            }],
        },
        yAxis: {
            title: { text: escapeHtml(i18n.t('Optimism (validation minus test)')) },
            labels: {
                formatter() {
                    return formatValue(Number(this.value));
                },
            },
            plotLines: [{ value: 0, color: colors.grey600, width: 1, zIndex: 2 }],
        },
        tooltip: {
            pointFormatter() {
                const pairs = this.options.custom?.nPairs;
                const detail = pairs ? `<br/>${escapeHtml(i18n.t('{{count}} pairs', { count: pairs }))}` : '';
                return `<span style="color:${this.color}">●</span> ${escapeHtml(this.series.name)}: <b>${escapeHtml(formatValue(this.y ?? 0))}</b>${detail}<br/>`;
            },
        },
        plotOptions: { series: { animation: false } },
        series: [
            {
                type: 'scatter',
                name: windowSize ? i18n.t('Mean optimism at k (adjusted to d = 0)') : i18n.t('Mean optimism at d (adjusted to k = {{n}})', { n }),
                color: colors.blue600,
                data: series.points.map(point => ({
                    ...point,
                    marker: { radius: 3 + 5 * Math.sqrt((point.custom?.nPairs ?? 1) / maxPairs) },
                })),
            },
            { type: 'line', name: i18n.t('Fitted line'), color: colors.blue800, marker: { enabled: false }, data: series.fitted, enableMouseTracking: false },
            { type: 'scatter', name: estimateName, color: colors.red600, marker: { symbol: 'diamond', radius: 7 }, data: [series.estimate] },
        ],
    };
    return <HighchartsReact highcharts={Highcharts} options={options} />;
};
