import i18n from '@dhis2/d2-i18n';
import { colors } from '@dhis2/ui';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { PredictionSetupMonitoring } from '@chap-blocks/api';
import { escapeHtml } from '../../../utils/escapeHtml';
import { monitoringSeries } from './monitoringSeries';

const defaultFormat = (value: number) => value.toLocaleString(undefined, { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });

export type MonitoringChartProps = {
    /** Response of Chap's prediction-setup monitoring endpoint. */
    monitoring: PredictionSetupMonitoring;
    /** Axis label for the metric; defaults to its id. */
    metricName?: string;
    /** Display name of the baseline; defaults to `monitoring.baselineModel`. */
    baselineName?: string;
    /** Formats a signed comparison value, e.g. as a percentage for skill ratios. */
    formatValue?: (value: number) => string;
    height?: number;
};

/** Each run's score compared with a baseline: positive is better. Evaluation splits in grey, prediction runs in blue. */
export const MonitoringChart = ({
    monitoring,
    metricName = monitoring.metricId,
    baselineName = monitoring.baselineModel,
    formatValue = defaultFormat,
    height = 320,
}: MonitoringChartProps) => {
    const series = monitoringSeries(monitoring);
    const runs = [...series.evaluationPerSplit, ...series.perRun];
    if (!runs.length) return <p>{i18n.t('No observed prediction outcomes yet.')}</p>;
    // A comparison is null when it is undefined, e.g. a skill ratio against a baseline that scored zero.
    if (!runs.some(point => point.y != null)) {
        return <p>{i18n.t('The comparison with {{baseline}} is undefined for these runs, for example when the baseline scores zero.', { baseline: baselineName })}</p>;
    }
    // Keep both sides of zero in view so the better and worse bands always show.
    const extent = Math.max(0, ...[...runs, ...series.predictionTrend].map(point => Math.abs(point.y ?? 0)));
    const options: Highcharts.Options = {
        chart: { type: 'line', height, style: { fontFamily: 'inherit' } },
        title: { text: undefined },
        exporting: { enabled: false },
        credits: { enabled: false },
        xAxis: { type: 'datetime', title: { text: i18n.t('Prediction origin period') } },
        yAxis: {
            title: { text: escapeHtml(i18n.t('{{metric}} improvement over {{baseline}}', { metric: metricName, baseline: baselineName })) },
            labels: {
                formatter() {
                    return formatValue(Number(this.value));
                },
            },
            plotLines: [{ value: 0, color: colors.grey600, width: 1, zIndex: 2 }],
            plotBands: [
                {
                    from: 0,
                    to: Number.MAX_VALUE,
                    color: colors.green050,
                    label: { text: escapeHtml(i18n.t('Better than {{baseline}}', { baseline: baselineName })), align: 'left', verticalAlign: 'top', x: 8, y: 16, style: { color: colors.green800, fontWeight: '600' } },
                },
                {
                    from: -Number.MAX_VALUE,
                    to: 0,
                    color: colors.red050,
                    label: { text: escapeHtml(i18n.t('Worse than {{baseline}}', { baseline: baselineName })), align: 'left', verticalAlign: 'bottom', x: 8, y: -8, style: { color: colors.red800, fontWeight: '600' } },
                },
            ],
            softMax: extent * 0.15 || 0.1,
            softMin: -(extent * 0.15 || 0.1),
            // Room above and below the data for the band labels.
            minPadding: 0.2,
            maxPadding: 0.2,
            startOnTick: false,
            endOnTick: false,
        },
        tooltip: {
            headerFormat: '<b>{point.key}</b><br/>',
            pointFormatter() {
                const value = this.y ?? 0;
                const color = value > 0 ? colors.green800 : value < 0 ? colors.red800 : colors.grey700;
                const scored = i18n.t('{{count}} forecasts scored', {
                    count: this.options.custom?.nObserved ?? 0,
                    defaultValue: '{{count}} forecast scored',
                    defaultValue_plural: '{{count}} forecasts scored',
                });
                return `<span style="color:${this.color}">●</span> ${escapeHtml(this.series.name)}: <b style="color:${color}">${escapeHtml(formatValue(value))}</b><br/>${scored}<br/>`;
            },
        },
        plotOptions: { series: { animation: false, marker: { enabled: true, radius: 5, symbol: 'circle' } } },
        series: [
            { type: 'line', name: i18n.t('Evaluation splits'), data: series.evaluationPerSplit, color: colors.grey500, showInLegend: !!series.evaluationPerSplit.length },
            { type: 'line', name: i18n.t('Evaluation average'), marker: { enabled: false }, data: series.evaluation, color: colors.grey600, dashStyle: 'Dash', enableMouseTracking: false, showInLegend: !!series.evaluation.length },
            { type: 'line', name: i18n.t('Prediction runs'), data: series.perRun, color: colors.blue600, showInLegend: !!series.perRun.length },
            { type: 'line', name: i18n.t('Prediction trend'), marker: { enabled: false }, data: series.predictionTrend, color: colors.blue800, lineWidth: 3, showInLegend: !!series.predictionTrend.length },
        ],
    };
    return (
        <>
            <HighchartsReact highcharts={Highcharts} options={options} />
            {!series.perRun.length && <p>{i18n.t('No observed prediction outcomes yet.')}</p>}
        </>
    );
};
