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
    /** Plot the gap against the validation window size or against the distance to the test split. */
    axis: SelectionBiasAxis;
    /** Formats a gap, e.g. as a percentage for skill ratios. */
    formatValue?: (value: number) => string;
    height?: number;
};

/**
 * The gap between the final pick and each validation window's pick on the later splits, against
 * the window size or the distance to the test split: the measured means as points and the fitted
 * line. On the window-size axis the estimated bias is marked at the full window; on the distance
 * axis the line is flat at the estimated bias, as a check that the gap does not drift.
 */
export const SelectionBiasChart = ({ selectionBias, axis, formatValue = defaultFormat, height = 300 }: SelectionBiasChartProps) => {
    const series = selectionBiasSeries(selectionBias, axis);
    const n = selectionBias.splitPeriods.length;
    const windowSize = axis === 'windowSize';
    const estimateName = i18n.t('Estimated bias (all {{count}} splits)', { count: n });
    const maxPairs = Math.max(1, ...series.points.map(point => point.custom?.nPairs ?? 1));
    const options: Highcharts.Options = {
        chart: { height, style: { fontFamily: 'inherit' } },
        title: { text: undefined },
        exporting: { enabled: false },
        credits: { enabled: false },
        xAxis: {
            title: { text: escapeHtml(windowSize ? i18n.t('Validation window size k (splits)') : (selectionBias.gapSplits > 0 ? i18n.t('Distance d after the window and a {{gap}}-split gap (splits)', { gap: selectionBias.gapSplits }) : i18n.t('Distance d after the validation window (splits)'))) },
            allowDecimals: false,
        },
        yAxis: {
            title: { text: escapeHtml(i18n.t('Gap (final pick minus window pick)')) },
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
                name: windowSize ? i18n.t('Mean gap at k') : i18n.t('Mean gap at d (adjusted to k = {{n}})', { n }),
                color: colors.blue600,
                data: series.points.map(point => ({
                    ...point,
                    marker: { radius: 3 + 5 * Math.sqrt((point.custom?.nPairs ?? 1) / maxPairs) },
                })),
            },
            {
                type: 'line',
                name: windowSize ? i18n.t('Fitted line') : i18n.t('Estimated bias'),
                color: windowSize ? colors.blue800 : colors.red600,
                dashStyle: windowSize ? 'Solid' : 'Dash',
                marker: { enabled: false },
                data: series.fitted,
                enableMouseTracking: false,
            },
            ...(series.estimate
                ? [{ type: 'scatter' as const, name: estimateName, color: colors.red600, marker: { symbol: 'diamond', radius: 7 }, data: [series.estimate] }]
                : []),
        ],
    };
    return <HighchartsReact highcharts={Highcharts} options={options} />;
};
