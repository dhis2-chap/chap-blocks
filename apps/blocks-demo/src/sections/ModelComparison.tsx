import { useState } from 'react';
import type { MetricInfo } from '@chap-blocks/api';
import {
    ForecastBandsChart,
    ModelContrastBars,
    RankGrid,
    RankingSlopeChart,
    forecastHits,
    type ForecastLayer,
    type ModelContrastRow,
    type RankScores,
} from '@chap-blocks/ui/charts';
import type { PredictionOrgUnitSeries } from '@chap-blocks/ui';
import { Group, Section } from '../gallery/Section';
import { REGIONS, monthlyPeriods } from '../data/synthetic';

/** Small seeded generator so every reload shows the same pictures. */
function seeded(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 2 ** 32;
    };
}

// ---------------------------------------------------------------------------
// ForecastBandsChart: a backtest-style forecast with what was observed in the forecast months.
// ---------------------------------------------------------------------------

const HISTORY = monthlyPeriods('202401', 8);
const FORECAST = monthlyPeriods('202409', 10);
const Z = [-1.28, -0.67, 0, 0.67, 1.28];

const backtest = (() => {
    const random = seeded(23);
    const level = (index: number) => 70 + 35 * Math.sin(((index + 2) / 12) * 2 * Math.PI);
    const samples: Record<string, number[]> = {};
    const points = FORECAST.map((period, offset) => {
        const index = HISTORY.length + offset;
        const median = level(index) * 0.95;
        const width = 9 + offset * 1.6;
        const values = Array.from({ length: 10 }, () => Math.max(0, Math.round(median + (random() + random() + random() - 1.5) * width * 1.4)));
        samples[period] = values;
        const [low, midLow, mid, midHigh, high] = Z.map(z => Math.max(0, Math.round(median + z * width)));
        return { period, periodLabel: period, quantiles: { quantile_low: low, quantile_mid_low: midLow, median: mid, quantile_mid_high: midHigh, quantile_high: high } };
    });
    // Two months spike above the forecast so the misses have something to show.
    const observed = [...HISTORY, ...FORECAST].map((period, index) => ({
        period,
        value: Math.round(level(index) + (random() - 0.5) * 16 + (index === 11 ? 32 : index === 12 ? 22 : 0)),
    }));
    const series: PredictionOrgUnitSeries = { targetId: 'disease_cases', orgUnitId: 'lakeside', orgUnitName: 'Lakeside', points, actualCases: observed };
    return { series, samples };
})();

const LAYERS: { id: ForecastLayer; label: string }[] = [
    { id: 'samples', label: 'Samples' },
    { id: 'outer', label: '80% band' },
    { id: 'mid', label: '50% band' },
    { id: 'median', label: 'Median' },
    { id: 'observed', label: 'Observed' },
    { id: 'hits', label: 'Hits' },
    { id: 'misses', label: 'Misses' },
    { id: 'errors', label: 'Errors' },
];

function ForecastBandsExample() {
    const [layers, setLayers] = useState<Partial<Record<ForecastLayer, boolean>>>({
        samples: false, outer: true, mid: true, median: true, observed: true, hits: true, misses: true, errors: false,
    });
    const summary = forecastHits(backtest.series);
    return (
        <div className="stack">
            <div className="row-wrap" role="group" aria-label="Layers">
                {LAYERS.map(layer => (
                    <label key={layer.id} className="row-wrap" style={{ gap: 4, fontSize: 14 }}>
                        <input type="checkbox" checked={!!layers[layer.id]} onChange={event => setLayers(current => ({ ...current, [layer.id]: event.target.checked }))} />
                        {layer.label}
                    </label>
                ))}
            </div>
            <ForecastBandsChart series={backtest.series} samples={backtest.samples} layers={layers} />
            <p className="muted">
                <code>forecastHits</code>: {summary.hits} of {summary.scored} observed months inside the 80% band
                (coverage {Math.round((summary.coverage ?? 0) * 100)}%), MAE {summary.mae?.toFixed(1)} cases.
            </p>
        </div>
    );
}

const forecastBandsCode = `import { ForecastBandsChart, forecastHits } from '@chap-blocks/ui/charts';

// series: one org unit's forecast (buildPredictionSeries / evaluation data) with actualCases
<ForecastBandsChart
  series={series}
  layers={{ samples: false, hits: true, misses: true, errors: step >= 2 }}
  samples={samplesByPeriod}          // optional: dots for each sample
  highlightPeriod="202412"           // optional: shade one period
/>

const { coverage, mae, hits, scored } = forecastHits(series);`;

// ---------------------------------------------------------------------------
// ModelContrastBars: two models' CRPS per org unit.
// ---------------------------------------------------------------------------

const crps = { id: 'crps', displayName: 'CRPS', optimizationDirection: 'minimize', comparisonOp: 'skill_ratio', sortOrder: 0, isSelected: true } as MetricInfo;
const EXTRA_REGIONS = [
    { id: 'northgate', name: 'Northgate' },
    { id: 'eastwood', name: 'Eastwood' },
    { id: 'southport', name: 'Southport' },
    { id: 'westfield', name: 'Westfield' },
];

const contrastRows: ModelContrastRow[] = (() => {
    const random = seeded(5);
    return [...REGIONS, ...EXTRA_REGIONS].map((region, index) => {
        const base = 6 + random() * 14;
        // The climate model does better in the first half of the list, worse in the rest.
        const shift = (index < 6 ? -1 : 1) * random() * base * 0.35;
        return { id: region.id, label: region.name, a: Number((base + shift).toFixed(2)), b: Number(base.toFixed(2)) };
    });
})();

const contrastCode = `import { ModelContrastBars } from '@chap-blocks/ui/charts';

// One row per org unit with both models' score on the same metric, e.g. from two backtests
<ModelContrastBars
  rows={orgUnits.map(ou => ({ id: ou.id, label: ou.name, a: scoresA[ou.id], b: scoresB[ou.id] }))}
  names={['Climate ARIMA', 'Seasonal naive']}
  metric={metrics.find(m => m.id === 'crps')}   // direction and target decide "better"
  count={8}                                       // optional: the rows that differ most
/>`;

// ---------------------------------------------------------------------------
// RankGrid: models ranked per year.
// ---------------------------------------------------------------------------

const MODELS = [
    { id: 'naive', label: 'Seasonal naive (baseline)' },
    { id: 'ar', label: 'Auto-regressive' },
    { id: 'arima', label: 'Climate ARIMA' },
    { id: 'ewars', label: 'EWARS' },
    { id: 'inla', label: 'INLA spatial' },
];
const YEARS = Array.from({ length: 10 }, (_, index) => String(2015 + index)).map(id => ({ id, label: id }));

const rankScores: RankScores = (() => {
    const random = seeded(31);
    const skill: Record<string, number> = { naive: 1, ar: 0.9, arima: 0.86, ewars: 0.93, inla: 0.88 };
    return Object.fromEntries(MODELS.map(model => [model.id, Object.fromEntries(YEARS.map(year => [
        year.id,
        model.id === 'ewars' && year.id === '2016' ? null : Number((skill[model.id] * (0.75 + random() * 0.5)).toFixed(3)),
    ]))]));
})();

const rankGridCode = `import { RankGrid } from '@chap-blocks/ui/charts';

<RankGrid
  rows={models.map(m => ({ id: m.id, label: m.name }))}
  columns={years.map(year => ({ id: year, label: year }))}   // or org units
  scores={{ [modelId]: { [year]: crps } }}
  metric={metrics.find(m => m.id === 'crps')}
  highlightRows={['naive']}                                  // e.g. the baseline
/>`;

// ---------------------------------------------------------------------------
// RankingSlopeChart: org units by forecast and by observed incidence.
// ---------------------------------------------------------------------------

const rankingItems = (() => {
    const random = seeded(17);
    return [...REGIONS, ...EXTRA_REGIONS].map((region, index) => {
        const observed = 4 + (10 - index) * 1.6 + random() * 5;
        return { id: region.id, label: region.name, observed: Number(observed.toFixed(1)), forecast: Number((observed * (0.7 + random() * 0.6)).toFixed(1)) };
    });
})();

const rankingCode = `import { RankingSlopeChart } from '@chap-blocks/ui/charts';

// One item per org unit for the same period: forecast median and observed value, e.g. per 1000 people
<RankingSlopeChart
  items={orgUnits.map(ou => ({ id: ou.id, label: ou.name, forecast: median[ou.id], observed: observed[ou.id] }))}
  top={3}                                     // optional: how many of the forecast top 3 really were top 3
  formatValue={value => value.toFixed(1)}
/>`;

export function ModelComparisonGroup() {
    return (
        <Group
            id="comparing-models"
            title="Comparing models"
            intro="Views from the autumn 2026 webinars, made generic: read a forecast layer by layer, compare two models where they differ, check whether a winner wins everywhere, and see how well a forecast orders org units."
        >
            <Section
                id="forecast-bands-chart"
                title="ForecastBandsChart"
                importFrom="@chap-blocks/ui/charts"
                exports={['ForecastBandsChart', 'forecastHits']}
                description={<p>A forecast drawn in layers that can be turned on one at a time: samples, the 80% and 50% bands, the median and what was observed. Observed values inside the 80% band get a filled dot, those outside a ring, and a stick from the median shows the error MAE averages. Hidden layers keep their space, so stepping through them never moves the plot. <code>forecastHits</code> gives the coverage and MAE behind the marks.</p>}
                props={[
                    { name: 'series', type: 'PredictionOrgUnitSeries', required: true, description: 'One org unit\'s forecast; actualCases before the first forecast period are drawn as history, the rest are scored.' },
                    { name: 'layers', type: 'Partial<Record<ForecastLayer, boolean>>', description: 'samples, outer, mid, median, observed, hits, misses, errors. Default: bands, median and observed.' },
                    { name: 'samples', type: 'Record<string, number[]>', description: 'Sample values per forecast period, drawn when the samples layer is on.' },
                    { name: 'highlightPeriod', type: 'string', description: 'A forecast period to shade.' },
                    { name: 'formatPeriod', type: '(period: string) => string', description: 'X-axis labels. Default: short period names.' },
                    { name: 'targetName', type: 'string', description: 'Y-axis label. Default "Cases".' },
                    { name: 'height', type: 'number', description: 'Height in viewBox units; the chart scales to its width. Default 280.' },
                    { name: 'hideLegend', type: 'boolean', description: 'Hide the legend under the plot.' },
                ]}
                code={forecastBandsCode}
                wide
            >
                <ForecastBandsExample />
            </Section>

            <Section
                id="model-contrast-bars"
                title="ModelContrastBars"
                importFrom="@chap-blocks/ui/charts"
                exports={['ModelContrastBars', 'contrastModels']}
                description={<p>Two models compared row by row on one metric: a bar to the right where the first model scores better, to the left where the second does, longest first. Answers where (or when) one model beats the other, which an average over the whole country hides. The metric's direction and target decide what "better" means, as in <code>BenchmarkTable</code>.</p>}
                props={[
                    { name: 'rows', type: 'ModelContrastRow[]', required: true, description: 'id, label, a and b: both models\' scores per org unit, period or forecast. Rows missing a score are left out.' },
                    { name: 'names', type: '[string, string]', required: true, description: 'The first and second model\'s names.' },
                    { name: 'metric', type: 'MetricInfo', description: 'Name, unit, direction and target. Without it lower is better.' },
                    { name: 'count', type: 'number', description: 'Show only the rows where the models differ most.' },
                    { name: 'rowLabel', type: 'string', description: 'Heading of the label column. Default "Org unit".' },
                ]}
                code={contrastCode}
                wide
            >
                <ModelContrastBars rows={contrastRows} names={['Climate ARIMA', 'Seasonal naive']} metric={crps} count={8} />
            </Section>

            <Section
                id="rank-grid"
                title="RankGrid"
                importFrom="@chap-blocks/ui/charts"
                exports={['RankGrid', 'rankColumns']}
                description={<p>Each model's rank in each year (or org unit), rank 1 filled, and how often each model ranks first. A model that is best on average but first in few years or places may just have been lucky. Ties share a rank; a missing score leaves the cell empty.</p>}
                props={[
                    { name: 'rows', type: '{ id: string; label: string }[]', required: true, description: 'The things ranked, e.g. configured models.' },
                    { name: 'columns', type: '{ id: string; label: string }[]', required: true, description: 'What they are ranked in, e.g. years or org units.' },
                    { name: 'scores', type: 'Record<rowId, Record<columnId, number | null>>', required: true, description: 'One score per row and column.' },
                    { name: 'metric', type: 'MetricInfo', description: 'Direction and target decide which score ranks first. Without it lower is better.' },
                    { name: 'highlightRows', type: 'string[]', description: 'Rows to set apart, e.g. baselines.' },
                    { name: 'rowLabel', type: 'string', description: 'Heading of the label column. Default "Model".' },
                ]}
                code={rankGridCode}
                wide
            >
                <RankGrid rows={MODELS} columns={YEARS} scores={rankScores} metric={crps} highlightRows={['naive']} />
            </Section>

            <Section
                id="ranking-slope-chart"
                title="RankingSlopeChart"
                importFrom="@chap-blocks/ui/charts"
                exports={['RankingSlopeChart', 'rankOrder', 'topOverlap']}
                description={<p>Org units in forecast order on the left and observed order on the right, one line per org unit. Flat, dark lines mean the forecast put an org unit in the right place; steep, light lines show where the ranking went wrong. Useful when a forecast is used to decide which districts to act on first.</p>}
                props={[
                    { name: 'items', type: '{ id, label, forecast, observed }[]', required: true, description: 'One per org unit, for the same period. Rank by incidence rather than cases so large org units do not top the list by size alone.' },
                    { name: 'top', type: 'number', description: 'Mark the top N and say how many of the forecast top N were in the observed top N.' },
                    { name: 'formatValue', type: '(value: number) => string', description: 'Formats the values next to the names.' },
                    { name: 'forecastLabel', type: 'string', description: 'Left heading. Default "Forecast order".' },
                    { name: 'observedLabel', type: 'string', description: 'Right heading. Default "Observed order".' },
                ]}
                code={rankingCode}
            >
                <RankingSlopeChart items={rankingItems} top={3} />
            </Section>
        </Group>
    );
}
