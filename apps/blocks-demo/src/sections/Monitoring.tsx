import { MonitoringChart } from '@chap-blocks/ui/charts';
import { useState } from 'react';
import { BenchmarkTable, OutbreakMetricsTable, SignalReviewTable, type BenchmarkTableRun, type SignalReview } from '@chap-blocks/ui/tables';
import { AlertApproval, type AlertRead, type MetricInfo, type MonitoringSource, OutbreakMetricInfo, OutbreakMetricKind, OutbreakMetricsRow, PredictionSetupMonitoring } from '@chap-blocks/api';
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

const orgUnitNames = new Map([['bo', 'Bo'], ['kenema', 'Kenema'], ['kono', 'Kono'], ['bombali', 'Bombali']]);
const SEVERITY: Record<string, number> = { Watch: 1, Alert: 2 };
const signalSeverity = (alert: AlertRead) => SEVERITY[alert.level] ?? 0;
let nextId = 1;
const signal = (orgUnit: string, timePeriod: string, level: string, approved = AlertApproval.PENDING, approvedBy?: string): AlertRead => ({
    id: nextId++, orgUnit, timePeriod, level, alertPolicyId: 1, approved, approvedBy,
});
const initialSignals = [
    signal('bo', '2025-05', 'Watch'),
    signal('bo', '2025-06', 'Alert'),
    signal('kenema', '2025-05', 'Watch'),
    signal('kenema', '2025-06', 'Watch'),
    signal('kono', '2025-06', 'Alert'),
    signal('bombali', '2025-05', 'Alert', AlertApproval.APPROVED, 'district.officer'),
];

function SignalReviewExample() {
    const [signals, setSignals] = useState(initialSignals);
    const onReview = ({ alertIds, decision }: SignalReview) => setSignals(current => current.map(alert => (
        alertIds.includes(alert.id)
            ? { ...alert, approved: decision, approvedBy: decision === AlertApproval.PENDING ? null : 'you' }
            : alert
    )));
    return (
        <SignalReviewTable
            alerts={signals}
            orgUnitNames={orgUnitNames}
            formatPeriod={period => new Date(`${period}-01`).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            getSeverity={signalSeverity}
            onReview={onReview}
        />
    );
}

const signalReviewCode = `import { SignalReviewTable } from '@chap-blocks/ui/tables';

// alerts: chap.alerts.listAlerts…(undefined, predictionId)
const review = useMutation({
  mutationFn: ({ alertIds, decision }: SignalReview) =>
    chap.alerts.approveAlerts…({ alertIds, approved: decision, approvedBy: user }),
});

<SignalReviewTable
  alerts={alerts}
  orgUnitNames={new Map(orgUnits.map(ou => [ou.id, ou.name]))}
  formatPeriod={formatPeriod}
  getSeverity={alert => severityByLevel[alert.level]}
  onReview={review.mutate}
  saving={review.isPending ? review.variables : undefined}
/>`;

const benchmarkMetrics = [
    { id: 'crps_log1p', displayName: 'CRPS (log)', optimizationDirection: 'minimize', comparisonOp: 'skill_ratio', sortOrder: 0, isSelected: true },
    { id: 'mae', displayName: 'MAE', unit: 'cases', optimizationDirection: 'minimize', comparisonOp: 'skill_ratio', sortOrder: 1, isSelected: true },
    { id: 'coverage_10_90', displayName: 'Coverage 10–90%', target: 0.8, optimizationDirection: 'minimize', comparisonOp: 'target_distance', sortOrder: 2, isSelected: true },
] as MetricInfo[];

const benchmarkRuns: BenchmarkTableRun[] = [
    { id: 1, name: 'Seasonal naive', version: '1', aggregateMetrics: { crps_log1p: 0.41, mae: 18.2, coverage_10_90: 0.74 } },
    { id: 2, name: 'Auto-regressive', version: '2.1', aggregateMetrics: { crps_log1p: 0.36, mae: 15.9, coverage_10_90: 0.79 }, comparison: { crps_log1p: 0.122, mae: 0.126, coverage_10_90: 0.05 } },
    { id: 3, name: 'MSTL ARIMA', version: '0.4', aggregateMetrics: { crps_log1p: 0.44, mae: 17.1, coverage_10_90: 0.86 }, comparison: { crps_log1p: -0.073, mae: 0.06, coverage_10_90: 0 } },
];

const benchmarkCode = `import { BenchmarkTable } from '@chap-blocks/ui/tables';

// runs from chap.backtests…getBacktestSpecification…(id).backtests, named by their configured model
<BenchmarkTable
  runs={runs.map(run => ({ id: run.id, name, aggregateMetrics: run.aggregateMetrics, comparison, version }))}
  metricIds={['crps_log1p', 'mae', 'coverage_10_90']}
  metrics={specification.metrics}
  reference={{ name: 'Seasonal naive', runId: 1 }}   // optional: compare with a baseline
/>`;

export function MonitoringGroup() {
    return (
        <Group
            id="monitoring"
            title="Monitoring & signals"
            intro="How a model performs over time against a baseline, how well a signal policy matches observed outbreaks, and reviewing the signals a run raised."
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

            <Section
                id="signal-review-table"
                title="SignalReviewTable"
                importFrom="@chap-blocks/ui/tables"
                exports={['SignalReviewTable', 'SignalReview']}
                description={<p>Approve or decline the signals a prediction run raised, one row per organisation unit. Only pending signals can be selected, so a bulk decision never overturns an earlier review. The host owns the data, the reviewer and saving.</p>}
                props={[
                    { name: 'alerts', type: 'AlertRead[]', required: true, description: 'The signals to review, e.g. the alerts of one prediction run.' },
                    { name: 'orgUnitNames', type: 'ReadonlyMap<string, string>', required: true, description: 'Display names by org unit id; unknown ids show as-is.' },
                    { name: 'formatPeriod', type: '(period: string) => string', required: true, description: 'Formats a Chap period id.' },
                    { name: 'onReview', type: '(review: SignalReview) => void', required: true, description: 'Called with the alert ids and the decision (approved, declined or pending again).' },
                    { name: 'saving', type: 'SignalReview', description: 'The review being saved: its buttons spin and other actions wait.' },
                    { name: 'disabled', type: 'boolean', description: 'Disables every action, e.g. until the reviewer is known.' },
                    { name: 'getSeverity', type: '(alert) => number', description: 'Ranks levels, higher being more severe; adds "Select by level".' },
                    { name: 'renderLevel', type: '(alert) => ReactNode', description: 'Replaces the plain level name, e.g. with a coloured tag.' },
                    { name: 'renderDetails', type: '(alerts) => ReactNode', description: 'Evidence for an org unit\'s signals; makes rows expandable.' },
                ]}
                code={signalReviewCode}
                wide
            >
                <SignalReviewExample />
            </Section>

            <Section
                id="benchmark-table"
                title="BenchmarkTable"
                importFrom="@chap-blocks/ui/tables"
                exports={['BenchmarkTable', 'getBestRunIds', 'metricSortKey', 'formatComparison', 'formatScore', 'prettifyMetricId']}
                description={<p>Model runs on one benchmark, a column per metric, sortable, with the best score in each column highlighted. With a reference, each score shows how it compares with that model instead.</p>}
                props={[
                    { name: 'runs', type: 'BenchmarkTableRun[]', required: true, description: 'One row per run: id, name, aggregateMetrics, and optionally comparison and version.' },
                    { name: 'metricIds', type: 'string[]', required: true, description: 'The metric columns, in order.' },
                    { name: 'metrics', type: 'MetricInfo[]', description: 'Metric catalog: names, units and direction. Without it nothing is highlighted as best.' },
                    { name: 'reference', type: '{ name: string; runId?: number }', description: 'Show comparisons with this model; its own run keeps its score.' },
                    { name: 'renderMetricInfo', type: '(metric, comparedWith?) => ReactNode', description: 'Shown after each metric name, e.g. an info icon.' },
                    { name: 'renderActions', type: '(run) => ReactNode', description: 'Adds an Actions column.' },
                    { name: 'showVersion', type: 'boolean', description: 'Show the Version column. Default true.' },
                    { name: 'initialSorting', type: 'SortingState', description: 'Sorting before the user sorts, e.g. [{ id: \'metric:crps_log1p\', desc: false }].' },
                ]}
                code={benchmarkCode}
                wide
            >
                <BenchmarkTable runs={benchmarkRuns} metricIds={['crps_log1p', 'mae', 'coverage_10_90']} metrics={benchmarkMetrics} />
                <BenchmarkTable runs={benchmarkRuns} metricIds={['crps_log1p', 'mae', 'coverage_10_90']} metrics={benchmarkMetrics} reference={{ name: 'Seasonal naive', runId: 1 }} />
            </Section>
        </Group>
    );
}
