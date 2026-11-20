import { describe, expect, it } from 'vitest';
import type { MetricInfo } from '@chap-blocks/api';
import type { PredictionOrgUnitSeries } from '../../interfaces/Prediction';
import { forecastHits } from './ForecastBandsChart/forecastHits';
import { contrastModels } from './ModelContrastBars/modelContrast';
import { rankColumns } from './RankGrid/ranks';
import { rankOrder, topOverlap } from './RankingSlopeChart/rankOrder';

const quantiles = (median: number) => ({
    quantile_low: median - 10, quantile_mid_low: median - 5, median, quantile_mid_high: median + 5, quantile_high: median + 10,
});

describe('forecastHits', () => {
    const series: PredictionOrgUnitSeries = {
        targetId: 'cases', orgUnitId: 'bo', orgUnitName: 'Bo',
        points: [
            { period: '2025W1', periodLabel: '', quantiles: quantiles(50) },
            { period: '2025W2', periodLabel: '', quantiles: quantiles(50) },
            { period: '2025W3', periodLabel: '', quantiles: quantiles(50) },
            { period: '2025W4', periodLabel: '', quantiles: quantiles(50) },
        ],
        // Week ids are matched canonically, so a padded id still finds its forecast.
        actualCases: [
            { period: '2024W52', value: 40 },
            { period: '2025W01', value: 60 },
            { period: '2025W2', value: 75 },
            { period: '2025W3', value: null },
        ],
    };

    it('counts observed values inside the outer band, with band edges inside, and averages the median error', () => {
        const summary = forecastHits(series);
        expect(summary.points.map(point => point.inside)).toEqual([true, false, null, null]);
        expect(summary).toMatchObject({ scored: 2, hits: 1, coverage: 0.5, mae: 17.5 });
    });

    it('returns null scores when nothing was observed', () => {
        expect(forecastHits({ ...series, actualCases: undefined })).toMatchObject({ scored: 0, coverage: null, mae: null });
    });
});

const crps = { id: 'crps', optimizationDirection: 'minimize' } as MetricInfo;
const coverage = { id: 'coverage', optimizationDirection: 'minimize', target: 0.8 } as MetricInfo;

describe('contrastModels', () => {
    it('orients the gap so positive favours the first model, sorts by size and skips incomplete rows', () => {
        const result = contrastModels([
            { id: 'bo', label: 'Bo', a: 10, b: 12 },
            { id: 'kono', label: 'Kono', a: 20, b: 14 },
            { id: 'kenema', label: 'Kenema', a: 5, b: 5 },
            { id: 'bombali', label: 'Bombali', a: null, b: 3 },
        ], crps);
        expect(result.rows.map(row => [row.id, row.gap])).toEqual([['kono', -6], ['bo', 2], ['kenema', 0]]);
        expect(result).toMatchObject({ winsA: 1, winsB: 1 });
    });

    it('scores a target metric by distance to the target', () => {
        const [row] = contrastModels([{ id: 'bo', label: 'Bo', a: 0.78, b: 0.95 }], coverage).rows;
        expect(row.gap).toBeCloseTo(0.13);
    });
});

describe('rankColumns', () => {
    it('ranks within each column, shares ranks on ties and counts first places', () => {
        const table = rankColumns(['naive', 'ar', 'arima'], ['2023', '2024', '2025'], {
            naive: { 2023: 3, 2024: 2, 2025: 4 },
            ar: { 2023: 1, 2024: 2, 2025: null },
            arima: { 2023: 2, 2024: 5 },
        }, crps);
        expect(table.ranks).toEqual({
            naive: { 2023: 3, 2024: 1, 2025: 1 },
            ar: { 2023: 1, 2024: 1 },
            arima: { 2023: 2, 2024: 3 },
        });
        expect(table.wins).toEqual({ naive: 2, ar: 2, arima: 0 });
        expect(table.rankedColumns).toBe(3);
    });
});

describe('rankOrder', () => {
    it('places items by forecast and by observed value, highest first, and counts the top overlap', () => {
        const placements = rankOrder([
            { id: 'a', label: 'A', forecast: 1, observed: 30 },
            { id: 'b', label: 'B', forecast: 3, observed: 10 },
            { id: 'c', label: 'C', forecast: 2, observed: 20 },
        ]);
        expect(placements.map(item => [item.id, item.forecastRank, item.observedRank])).toEqual([['b', 0, 2], ['c', 1, 1], ['a', 2, 0]]);
        expect(topOverlap(placements, 2)).toBe(1);
    });
});
