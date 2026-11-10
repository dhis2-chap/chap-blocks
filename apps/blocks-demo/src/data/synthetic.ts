// Synthetic, deterministic data for the gallery. No patient data, no server.
import type { DataElement, EvaluationEntry, PredictionEntry } from '@chap-blocks/api';
import {
    buildPredictionSeries,
    getPeriodNameFromId,
    type EndemicThresholdPoint,
    type EvaluationEntryExtend,
    type FeatureCollection,
    type PredictionOrgUnitSeries,
} from '@chap-blocks/ui';

/** Small seeded generator so every reload shows the same pictures. */
function seeded(seed: number) {
    let state = seed >>> 0;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 2 ** 32;
    };
}

export const REGIONS = [
    { id: 'lakeside', name: 'Lakeside' },
    { id: 'highlands', name: 'Highlands' },
    { id: 'riverbend', name: 'Riverbend' },
    { id: 'coastal', name: 'Coastal' },
    { id: 'savanna', name: 'Savanna' },
    { id: 'forest', name: 'Forest' },
] as const;

export const orgUnitsById = new Map<string, { displayName: string }>(
    REGIONS.map(region => [region.id, { displayName: region.name }]),
);

/** Monthly DHIS2 period ids, e.g. `202401`. */
export function monthlyPeriods(start: string, count: number): string[] {
    let year = Number(start.slice(0, 4));
    let month = Number(start.slice(4, 6));
    return Array.from({ length: count }, () => {
        const id = `${year}${String(month).padStart(2, '0')}`;
        month += 1;
        if (month > 12) {
            month = 1;
            year += 1;
        }
        return id;
    });
}

const QUANTILES = [0.1, 0.25, 0.5, 0.75, 0.9];
const SPREAD = [-1.28, -0.67, 0, 0.67, 1.28];

const seasonal = (index: number, base: number, amplitude: number, phase = 0) =>
    base + amplitude * Math.sin(((index + phase) / 12) * 2 * Math.PI);

// ---------------------------------------------------------------------------
// Forecasts: built from raw prediction entries with the exported helper.
// ---------------------------------------------------------------------------

export const HISTORY_PERIODS = monthlyPeriods('202401', 18);
export const FORECAST_PERIODS = monthlyPeriods('202507', 6);

function buildPredictionEntries(): PredictionEntry[] {
    const random = seeded(7);
    return REGIONS.flatMap((region, regionIndex) =>
        FORECAST_PERIODS.flatMap((period, periodIndex) => {
            const index = HISTORY_PERIODS.length + periodIndex;
            // Two regions get a growing surge so the threshold examples have something to flag.
            const surge = regionIndex === 0 || regionIndex === 4 ? periodIndex * 9 : 0;
            const median = seasonal(index, 60 + regionIndex * 14, 22 + regionIndex * 3, regionIndex) + surge;
            const width = 8 + periodIndex * 3 + random() * 4;
            return QUANTILES.map((quantile, q) => ({
                orgUnit: region.id,
                period,
                quantile,
                value: Math.max(0, Math.round(median + SPREAD[q] * width)),
            }));
        }),
    );
}

function buildActualCases(): DataElement[] {
    const random = seeded(11);
    return REGIONS.flatMap((region, regionIndex) =>
        HISTORY_PERIODS.map((pe, index) => ({
            pe,
            ou: region.id,
            value: Math.round(seasonal(index, 60 + regionIndex * 14, 22 + regionIndex * 3, regionIndex) + (random() - 0.5) * 18),
        })),
    );
}

export const predictionEntries = buildPredictionEntries();
export const actualCases = buildActualCases();

/** One series per region, labelled with readable period names. */
export const forecastSeries: PredictionOrgUnitSeries[] = buildPredictionSeries(
    predictionEntries,
    orgUnitsById,
    'disease_cases',
    actualCases,
    'MONTH',
).map(series => ({
    ...series,
    points: series.points.map(point => ({ ...point, periodLabel: getPeriodNameFromId(point.period) })),
}));

export const lakesideSeries = forecastSeries[0];

/** Endemic channel per region: historical-style upper and lower bound for each period. */
export function endemicChannel(regionIndex: number): EndemicThresholdPoint[] {
    const periods = [...HISTORY_PERIODS, ...FORECAST_PERIODS];
    return periods.map((period, index) => {
        const centre = seasonal(index, 52 + regionIndex * 12, 14, regionIndex);
        return { period, value: Math.round(centre + 14), lowerValue: Math.round(centre - 12) };
    });
}

export const thresholdMap = new Map(
    forecastSeries.map((series, index) => {
        // One region deliberately has no thresholds to show the "unavailable" state.
        if (index === 5) return [series.orgUnitId, undefined] as const;
        return [series.orgUnitId, endemicChannel(index)] as const;
    }).filter((entry): entry is readonly [string, EndemicThresholdPoint[]] => entry[1] !== undefined),
);

// ---------------------------------------------------------------------------
// Backtest evaluation: two models, three regions, two split periods.
// ---------------------------------------------------------------------------

export const SPLIT_PERIODS = ['202406', '202409'];
export const EVALUATION_MODELS = ['Seasonal naive', 'Climate ARIMA'];

function buildEvaluationEntries(): EvaluationEntryExtend[] {
    const random = seeded(23);
    const regions = REGIONS.slice(0, 3);
    return SPLIT_PERIODS.flatMap((splitPeriod) => {
        const horizon = monthlyPeriods(splitPeriod, 4).slice(1);
        return EVALUATION_MODELS.flatMap((modelName, modelIndex) =>
            regions.flatMap((region, regionIndex) =>
                horizon.flatMap((period) => {
                    const index = HISTORY_PERIODS.indexOf(period);
                    const truth = seasonal(index, 60 + regionIndex * 14, 22 + regionIndex * 3, regionIndex);
                    const bias = modelIndex === 0 ? 10 * (random() - 0.3) : 4 * (random() - 0.5);
                    const width = modelIndex === 0 ? 18 : 10;
                    return QUANTILES.map((quantile, q): EvaluationEntry & { modelName: string } => ({
                        orgUnit: region.name,
                        period,
                        quantile,
                        splitPeriod,
                        modelName,
                        value: Math.max(0, Math.round(truth + bias + SPREAD[q] * width)),
                    }));
                }),
            ),
        );
    });
}

export const evaluationEntries = buildEvaluationEntries();
/** Actual values keyed by region name, matching the evaluation entries' `orgUnit`. */
export const evaluationActuals: DataElement[] = actualCases
    .map(element => ({ ...element, ou: orgUnitsById.get(element.ou)?.displayName ?? element.ou }));

// ---------------------------------------------------------------------------
// Synthetic boundaries: six adjacent, irregular polygons on a shared vertex grid.
// ---------------------------------------------------------------------------

function buildBoundaries(): FeatureCollection {
    const random = seeded(5);
    const cols = 3;
    const rows = 2;
    const grid: [number, number][][] = [];
    for (let j = 0; j <= rows; j++) {
        grid.push([]);
        for (let i = 0; i <= cols; i++) {
            const interior = i > 0 && i < cols && j > 0 && j < rows;
            const jitter = interior ? 0.28 : 0.08;
            grid[j].push([
                30 + i * 0.9 + (random() - 0.5) * jitter,
                -1 - j * 0.8 + (random() - 0.5) * jitter,
            ]);
        }
    }
    const features = REGIONS.map((region, index) => {
        const i = index % cols;
        const j = Math.floor(index / cols);
        const ring = [grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i], grid[j][i]];
        return {
            type: 'Feature' as const,
            id: region.id,
            properties: { name: region.name },
            geometry: { type: 'Polygon' as const, coordinates: [ring] },
        };
    });
    return { type: 'FeatureCollection', features };
}

export const boundaries = buildBoundaries();

export const MODEL_NAMES = [
    'Seasonal naive',
    'Climate ARIMA',
    'Auto EWARS',
    'Weekly LSTM',
    'Negative binomial GLM',
    'Ensemble (median)',
    'Rainfall lag model',
    'Prophet baseline',
];
