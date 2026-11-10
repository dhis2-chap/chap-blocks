import { useMemo, useState } from 'react';
import {
    UncertaintyAreaChart,
    StatusIndicator,
    OUTBREAK_PROBABILITY_OPTIONS,
    buildOutbreakIndicatorsForSeries,
    getStableMaxYForThresholdChart,
    getThresholdTileViewModels,
    type OutbreakProbability,
    type ThresholdTileStatus,
} from '@chap-blocks/ui';
import { Group, Section } from '../gallery/Section';
import { endemicChannel, forecastSeries, lakesideSeries, thresholdMap } from '../data/synthetic';

const basicCode = `import { UncertaintyAreaChart } from '@chap-blocks/ui/charts';
import type { PredictionOrgUnitSeries } from '@chap-blocks/ui';

const series: PredictionOrgUnitSeries = {
  targetId: 'disease_cases',
  orgUnitId: 'lakeside',
  orgUnitName: 'Lakeside',
  points: [
    {
      period: '202507',               // DHIS2 period id
      periodLabel: 'July 2025',
      quantiles: {
        quantile_low: 41,             // 0.10
        quantile_mid_low: 50,         // 0.25
        median: 57,                   // 0.50
        quantile_mid_high: 64,        // 0.75
        quantile_high: 73,            // 0.90
      },
    },
    // …one point per forecast period
  ],
  // Optional observed history, drawn as an orange line
  actualCases: [{ period: '202401', value: 62 }],
};

<UncertaintyAreaChart
  series={series}
  predictionTargetName="Cases"
  chartHeight={340}
/>`;

const thresholdCode = `import { UncertaintyAreaChart } from '@chap-blocks/ui/charts';
import {
  buildOutbreakIndicatorsForSeries,
  type EndemicThresholdPoint,
  type OutbreakProbability,
} from '@chap-blocks/ui';

// Upper line = alert threshold; lowerValue draws the endemic channel band.
const thresholds: EndemicThresholdPoint[] = [
  { period: '202507', value: 70, lowerValue: 44 },
  // …
];
const probability: OutbreakProbability = 75;

// Periods where the 75 % signal line crosses the threshold are shaded.
const outbreakPeriods = buildOutbreakIndicatorsForSeries(series, probability, thresholds);

<UncertaintyAreaChart
  series={series}
  predictionTargetName="Cases"
  endemicThresholds={thresholds}
  outbreakProbability={probability}
  outbreakPeriods={outbreakPeriods}
  thresholdLines={[{ label: 'Epidemic line', points: epidemicLine }]}
/>`;

const tilesCode = `import { UncertaintyAreaChart } from '@chap-blocks/ui/charts';
import { StatusIndicator } from '@chap-blocks/ui/layout';
import {
  getThresholdTileViewModels,
  getStableMaxYForThresholdChart,
} from '@chap-blocks/ui';

// thresholdMap: Map<orgUnitId, EndemicThresholdPoint[]>
const { summary, tiles } = getThresholdTileViewModels(allSeries, 75, thresholdMap);

tiles.map(tile => (
  <article key={tile.orgUnitId}>
    <h4>{tile.orgUnitName}</h4>
    <StatusIndicator
      label={tile.status}
      variant={tile.status === 'outbreak' ? 'destructive' : 'success'}
    />
    <UncertaintyAreaChart
      variant="tile"
      series={tile.series}
      predictionTargetName="Cases"
      endemicThresholds={tile.endemicThresholds}
      outbreakPeriods={tile.indicators}
      maxY={getStableMaxYForThresholdChart(tile.series, tile.endemicThresholds)}
    />
  </article>
));`;

const chartProps = [
    { name: 'series', type: 'PredictionOrgUnitSeries', required: true, description: 'One org unit: forecast points with five quantiles, plus optional actualCases history.' },
    { name: 'predictionTargetName', type: 'string', required: true, description: 'Used in the chart title ("Prediction for Cases for Lakeside").' },
    { name: 'chartHeight', type: 'number | string', description: 'Highcharts height. Defaults to a 16:9 ratio (240px for tiles).' },
    { name: 'variant', type: "'default' | 'tile'", description: 'Tile hides title, legend, credits and axis title for compact grids.' },
    { name: 'maxY', type: 'number', description: 'Fixed y-axis max, so a grid of tiles shares a scale.' },
    { name: 'endemicThreshold', type: 'number | null', description: 'A single flat threshold line across every period.' },
    { name: 'endemicThresholds', type: 'EndemicThresholdPoint[]', description: 'Per-period threshold. Points with lowerValue also draw the shaded endemic channel.' },
    { name: 'thresholdLines', type: 'ThresholdChartLine[]', description: 'Extra labelled dashed lines ({ label, points }).' },
    { name: 'outbreakProbability', type: '10 | 25 | 50 | 75 | 90', description: 'Adds the signal line at the matching quantile (50 reuses the median).' },
    { name: 'outbreakPeriods', type: 'OutbreakPeriodChartInfo[]', description: 'Periods to shade red when outbreak is true; output of buildOutbreakIndicators*.' },
    { name: 'alertPeriods', type: '{ period, label, color }[]', description: 'Custom per-period bands and tooltip labels; replaces outbreakPeriods shading.' },
    { name: 'zoomRange / onZoomChange', type: 'ZoomRange | null / (range) => void', description: 'Controlled x-axis zoom to synchronise several charts.' },
];

function ThresholdExample() {
    const [probability, setProbability] = useState<OutbreakProbability>(75);
    const thresholds = useMemo(() => endemicChannel(0), []);
    const epidemicLine = useMemo(
        () => thresholds.map(point => ({ period: point.period, value: point.value === null ? null : Math.round(point.value * 1.3) })),
        [thresholds],
    );
    const thresholdLines = useMemo(() => [{ label: 'Epidemic line (×1.3)', points: epidemicLine }], [epidemicLine]);
    const outbreakPeriods = useMemo(
        () => buildOutbreakIndicatorsForSeries(lakesideSeries, probability, thresholds),
        [probability, thresholds],
    );
    return (
        <>
            <div className="toolbar" role="group" aria-label="Outbreak probability">
                <span>Signal probability</span>
                {OUTBREAK_PROBABILITY_OPTIONS.map(option => (
                    <button
                        key={option}
                        type="button"
                        className={option === probability ? 'chip chip-on' : 'chip'}
                        aria-pressed={option === probability}
                        onClick={() => setProbability(option)}
                    >
                        {option}%
                    </button>
                ))}
                <span className="toolbar-meta">
                    {outbreakPeriods.filter(period => period.outbreak).length} of {outbreakPeriods.length} forecast periods above threshold
                </span>
            </div>
            <UncertaintyAreaChart
                series={lakesideSeries}
                predictionTargetName="Cases"
                endemicThresholds={thresholds}
                outbreakProbability={probability}
                outbreakPeriods={outbreakPeriods}
                thresholdLines={thresholdLines}
                chartHeight={380}
            />
        </>
    );
}

const STATUS: Record<ThresholdTileStatus, { label: string; variant: 'destructive' | 'success' | 'default' }> = {
    outbreak: { label: 'Above threshold', variant: 'destructive' },
    noOutbreak: { label: 'Within channel', variant: 'success' },
    unavailable: { label: 'No threshold', variant: 'default' },
};

function TilesExample() {
    const { summary, tiles } = useMemo(() => getThresholdTileViewModels(forecastSeries, 75, thresholdMap), []);
    return (
        <>
            <p className="summary-line">
                <strong>{summary.regionsWithAlerts}</strong> of {summary.totalRegions} regions signal at 75 % ·{' '}
                <strong>{summary.alertPeriods}</strong> alert periods · {summary.unavailableThresholds} without thresholds
            </p>
            <div className="tile-grid">
                {tiles.map(tile => (
                    <article className="tile" key={tile.orgUnitId}>
                        <header>
                            <h4>{tile.orgUnitName}</h4>
                            <StatusIndicator
                                label={STATUS[tile.status].label}
                                variant={STATUS[tile.status].variant}
                                active={tile.status === 'outbreak'}
                            />
                        </header>
                        <UncertaintyAreaChart
                            variant="tile"
                            series={tile.series}
                            predictionTargetName="Cases"
                            endemicThresholds={tile.endemicThresholds}
                            outbreakProbability={75}
                            outbreakPeriods={tile.indicators}
                            maxY={getStableMaxYForThresholdChart(tile.series, tile.endemicThresholds)}
                        />
                    </article>
                ))}
            </div>
        </>
    );
}

export function ChartsGroup() {
    return (
        <Group
            id="charts"
            title="Forecast charts"
            intro="Highcharts-based, prop-driven. Pass a series; nothing fetches data or needs a provider."
        >
            <Section
                id="uncertainty-area-chart"
                title="UncertaintyAreaChart"
                importFrom="@chap-blocks/ui/charts"
                exports={['UncertaintyAreaChart']}
                description={
                    <p>
                        A forecast for one org unit: the median line over 50 % and 80 % prediction intervals, with optional
                        observed history. Year boundaries are marked, and the x-axis can be zoomed by dragging.
                    </p>
                }
                props={chartProps}
                code={basicCode}
            >
                <UncertaintyAreaChart series={lakesideSeries} predictionTargetName="Cases" chartHeight={360} />
            </Section>

            <Section
                id="threshold-chart"
                title="UncertaintyAreaChart with thresholds"
                importFrom="@chap-blocks/ui"
                exports={['UncertaintyAreaChart', 'buildOutbreakIndicatorsForSeries']}
                description={
                    <p>
                        The same block with an endemic channel (band + dashed upper threshold), an extra labelled threshold
                        line, and a signal line at the selected outbreak probability. Periods where the signal crosses the
                        threshold are shaded. Change the probability to see the shading recalculate.
                    </p>
                }
                code={thresholdCode}
            >
                <ThresholdExample />
            </Section>

            <Section
                id="threshold-tiles"
                title="Threshold tiles"
                importFrom="@chap-blocks/ui"
                exports={['getThresholdTileViewModels', 'getStableMaxYForThresholdChart']}
                description={
                    <p>
                        A region overview built from two helpers and the <code>tile</code> variant. Each tile gets a
                        status (outbreak, no outbreak, unavailable) and its own stable y-axis maximum. The last region has
                        no thresholds on purpose.
                    </p>
                }
                code={tilesCode}
                wide
            >
                <TilesExample />
            </Section>
        </Group>
    );
}
