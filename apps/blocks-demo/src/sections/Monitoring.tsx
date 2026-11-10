import { MonitoringChart } from '@chap-blocks/ui/charts';
import { OutbreakMetricsTable } from '@chap-blocks/ui/tables';
import type { MonitoringSource, OutbreakMetricInfo, OutbreakMetricKind, OutbreakMetricsRow, PredictionSetupMonitoring } from '@chap-blocks/api';
import { Group, Section } from '../gallery/Section';

const point = (period: string, source: string, value: number, runningValue: number, nObserved: number) => ({
    period, source: source as MonitoringSource, value, runningValue, nObserved,
});

const monitoring: PredictionSetupMonitoring = {
    metricId: 'crps',
    baselineModel: 'Seasonal naive',
    comparisonDescription: 'Relative improvement over the baseline.',
    evaluationValue: 0.12,
    points: [
        point('202406', 'evaluation', 0.08, 0.08, 120),
        point('202409', 'evaluation', 0.16, 0.12, 120),
        point('202501', 'prediction', 0.21, 0.21, 12),
        point('202502', 'prediction', -0.05, 0.09, 24),
        point('202503', 'prediction', 0.1, 0.09, 36),
        point('202504', 'prediction', 0.04, 0.08, 48),
    ],
};

const metric = (id: string, displayName: string, kind: string, description: string): OutbreakMetricInfo => ({
    id, displayName, kind: kind as OutbreakMetricKind, description,
});

const outbreakMetrics = [
    metric('sensitivity', 'Sensitivity', 'binary', 'Share of observed outbreaks that were signalled.'),
    metric('ppv', 'Precision', 'binary', 'Share of signals that matched an observed outbreak.'),
    metric('specificity', 'Specificity', 'binary', 'Share of non-outbreaks that stayed quiet.'),
    metric('f1', 'F1', 'binary', 'Balance of sensitivity and precision.'),
    metric('categorical_accuracy', 'Accuracy', 'categorical', 'Share of cases where the most severe level breached was right.'),
];

const row = (values: number[][], accuracy: number): OutbreakMetricsRow => ({
    nCells: 216,
    levels: ['Watch', 'Alert'].map((level, index) => ({
        level,
        metrics: Object.fromEntries(['sensitivity', 'ppv', 'specificity', 'f1'].map((id, i) => [id, values[index][i]])),
    })),
    categorical: { categorical_accuracy: accuracy },
});

const outbreakRow = row([[0.82, 0.41, 0.77, 0.55], [0.6, 0.67, 0.93, 0.63]], 0.78);
const referenceRow = row([[0.7, 0.38, 0.8, 0.49], [0.45, 0.7, 0.95, 0.55]], 0.74);

const monitoringCode = `import { MonitoringChart } from '@chap-blocks/ui/charts';

// From chap.predictionSetups.getPredictionSetupMonitoring…(setupId, metricId, baseline)
<MonitoringChart
  monitoring={monitoring}
  metricName="CRPS"
  baselineName="Seasonal naive"
  formatValue={v => v.toLocaleString(undefined, { style: 'percent', signDisplay: 'exceptZero' })}
/>`;

const outbreakCode = `import { OutbreakMetricsTable } from '@chap-blocks/ui/tables';

// metrics: chap.metrics.listOutbreakMetrics…()
// scores:  chap.metrics.getOutbreakMetrics…(backtestId, policyId)
{scores.rows.map(row => (
  <OutbreakMetricsTable
    key={row.horizonDistance ?? 'all'}
    row={row}
    metrics={metrics}
    referenceRow={baselineScores?.rows.find(r => r.horizonDistance === row.horizonDistance)}
    thresholds={{ Watch: 'Above the 75th percentile', Alert: 'Above the 90th percentile' }}
  />
))}`;

export function MonitoringGroup() {
    return (
        <Group
            id="monitoring"
            title="Monitoring & outbreak scoring"
            intro="How a model performs over time against a baseline, and how well a signal policy matches observed outbreaks."
        >
            <Section
                id="monitoring-chart"
                title="MonitoringChart"
                importFrom="@chap-blocks/ui/charts"
                exports={['MonitoringChart', 'monitoringSeries']}
                description={<p>Every evaluation split and prediction run, scored against a baseline. Above zero is better than the baseline; the trend pools all prediction runs so far.</p>}
                props={[
                    { name: 'monitoring', type: 'PredictionSetupMonitoring', required: true, description: 'Response of the prediction-setup monitoring endpoint.' },
                    { name: 'metricName', type: 'string', description: 'Axis label; defaults to the metric id.' },
                    { name: 'baselineName', type: 'string', description: 'Defaults to monitoring.baselineModel.' },
                    { name: 'formatValue', type: '(value: number) => string', description: 'Formats a signed comparison value.' },
                    { name: 'height', type: 'number', description: 'Chart height in pixels. Default 320.' },
                ]}
                code={monitoringCode}
                wide
            >
                <MonitoringChart
                    monitoring={monitoring}
                    metricName="CRPS"
                    formatValue={value => value.toLocaleString(undefined, { style: 'percent', maximumSignificantDigits: 3, signDisplay: 'exceptZero' })}
                />
            </Section>

            <Section
                id="outbreak-metrics-table"
                title="OutbreakMetricsTable"
                importFrom="@chap-blocks/ui/tables"
                exports={['OutbreakMetricsTable']}
                description={<p>Outbreak-detection scores for one signal policy: per-level binary metrics and whole-policy scores, optionally compared with a baseline model.</p>}
                props={[
                    { name: 'row', type: 'OutbreakMetricsRow', required: true, description: 'One row of the outbreak-metrics response (overall or one horizon).' },
                    { name: 'metrics', type: 'OutbreakMetricInfo[]', required: true, description: 'The metrics to show: binary ones as columns, categorical ones as the policy summary.' },
                    { name: 'referenceRow', type: 'OutbreakMetricsRow', description: 'The same row for a baseline; adds a green/red "vs" line per score.' },
                    { name: 'thresholds', type: 'Record<string, string>', description: 'Threshold text per level name; adds a Threshold column.' },
                ]}
                code={outbreakCode}
                wide
            >
                <OutbreakMetricsTable
                    row={outbreakRow}
                    metrics={outbreakMetrics}
                    referenceRow={referenceRow}
                    thresholds={{ Watch: 'Above the 75th percentile', Alert: 'Above the 90th percentile' }}
                />
            </Section>
        </Group>
    );
}
