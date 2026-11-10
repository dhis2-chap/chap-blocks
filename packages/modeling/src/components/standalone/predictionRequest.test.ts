import { describe, expect, it } from 'vitest';
import type {
    DataSetWithObservations,
    PredictionSetupReadWithPredictions,
} from '@chap-blocks/api';
import { predictionRequest } from './predictionRequest';
const dataset: DataSetWithObservations = {
    id: 7,
    name: 'Synthetic',
    created: null,
    periodType: 'month',
    geojson: JSON.stringify({
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                id: 'North',
                geometry: { type: 'Polygon', coordinates: [] },
            },
        ],
    }),
    observations: [
        {
            orgUnit: 'North',
            period: '2024-01',
            featureName: 'disease_cases',
            value: 12,
        },
    ],
};
const setup = {
    periodType: 'month',
    orgUnits: ['North'],
} as PredictionSetupReadWithPredictions;
describe('prediction from a saved dataset', () => {
    it('builds the real run endpoint payload from saved observations and boundaries', () => {
        expect(predictionRequest(dataset, setup, ' Forecast ', 3)).toEqual({
            name: 'Forecast',
            nPeriods: 3,
            type: 'prediction',
            providedData: dataset.observations,
            geojson: JSON.parse(dataset.geojson!),
        });
    });
    it('rejects mismatched periods, missing locations, missing geometry, and invalid horizons', () => {
        expect(() =>
            predictionRequest(
                dataset,
                { ...setup, periodType: 'week' },
                'Run',
                3,
            ),
        ).toThrow('same period');
        expect(() =>
            predictionRequest(
                dataset,
                { ...setup, orgUnits: ['South'] },
                'Run',
                3,
            ),
        ).toThrow('every location');
        expect(() =>
            predictionRequest({ ...dataset, geojson: null }, setup, 'Run', 3),
        ).toThrow('boundaries');
        for (const horizon of [0, -1, 1.5, NaN])
            expect(() =>
                predictionRequest(dataset, setup, 'Run', horizon),
            ).toThrow('whole number');
    });
});
