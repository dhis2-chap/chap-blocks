import type {
    DataSetWithObservations,
    FeatureCollectionModel,
    PredictionSetupReadWithPredictions,
    RunPredictionSetupRequest,
} from '@chap-blocks/api';
/** Validate the local choices before submitting an expensive model job. */
export function predictionRequest(
    dataset: DataSetWithObservations,
    setup: PredictionSetupReadWithPredictions,
    name: string,
    nPeriods: number,
): RunPredictionSetupRequest {
    if (!name.trim()) throw new Error('Enter a prediction name.');
    if (!Number.isInteger(nPeriods) || nPeriods < 1)
        throw new Error('Forecast periods must be a positive whole number.');
    if (
        setup.periodType &&
        dataset.periodType &&
        setup.periodType !== dataset.periodType
    )
        throw new Error(
            'The dataset and prediction setup must use the same period type.',
        );
    if (!dataset.geojson)
        throw new Error(
            'The dataset has no boundaries. Import a dataset with GeoJSON.',
        );
    const geojson = JSON.parse(dataset.geojson) as FeatureCollectionModel;
    if (geojson.type !== 'FeatureCollection' || !geojson.features?.length)
        throw new Error('The dataset boundaries are invalid.');
    if (!dataset.observations.length)
        throw new Error('The dataset contains no observations.');
    const observed = new Set(dataset.observations.map((row) => row.orgUnit));
    if (setup.orgUnits.some((id) => !observed.has(id)))
        throw new Error(
            'The dataset must contain every location in this prediction setup.',
        );
    return {
        name: name.trim(),
        nPeriods,
        geojson,
        providedData: dataset.observations,
        type: 'prediction',
    };
}
