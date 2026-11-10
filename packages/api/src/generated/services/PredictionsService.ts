/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { JobResponse } from '../models/JobResponse';
import type { MakePredictionRequest } from '../models/MakePredictionRequest';
import type { PredictionEntry } from '../models/PredictionEntry';
import type { PredictionInfo } from '../models/PredictionInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class PredictionsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Browse stored forecasts
     * List every prediction whose configured model row still exists in the database, so you can pick a forecast to inspect, plot, push back into DHIS2, or delete.
     *
     * Predictions whose configured model has been deleted outright are filtered out;
     * predictions whose configured model has only been archived (soft-deleted) still
     * appear, since the row is still resolvable. Baseline forecasts stored alongside
     * prediction setup runs for monitoring are left out.
     * @returns PredictionInfo Successful Response
     * @throws ApiError
     */
    public getPredictionsV1CrudPredictionsGet(): CancelablePromise<Array<PredictionInfo>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/crud/predictions',
        });
    }
    /**
     * View one forecast's metadata
     * Read the identifying information for a single prediction — the model and dataset behind it, when it ran, what periods it covers — without pulling the forecast values themselves.
     *
     * Use ``GET /v1/analytics/prediction-entry/{id}`` once you actually need quantiles to
     * plot. 404 if the id is unknown.
     * @param predictionId
     * @returns PredictionInfo Successful Response
     * @throws ApiError
     */
    public getPredictionV1CrudPredictionsPredictionIdGet(
        predictionId: number,
    ): CancelablePromise<PredictionInfo> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/crud/predictions/{predictionId}',
            path: {
                'predictionId': predictionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Remove a forecast
     * Permanently delete a prediction and every forecast row it contains. Use this to clean up obsolete or test forecasts from the listing.
     *
     * Refused with 409 while alerts raised from this prediction still exist: an alert
     * only means something alongside the forecast that justified it, so the alerts have
     * to go first. 404 if the id is unknown.
     * @param predictionId
     * @returns any Successful Response
     * @throws ApiError
     */
    public deletePredictionV1CrudPredictionsPredictionIdDelete(
        predictionId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/v1/crud/predictions/{predictionId}',
            path: {
                'predictionId': predictionId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read forecast quantiles for a prediction (query parameter id)
     * Pull the chosen quantiles (median, 10th and 90th percentile, ...) out of a prediction so they can be charted, exported, or fed back into DHIS2.
     *
     * Returns one entry per (period, region, quantile) tuple. Same response as
     * ``GET /v1/analytics/prediction-entry/{predictionId}`` — only the parameter style
     * differs; that variant takes the id in the path. 404 if the prediction id is unknown.
     * @param predictionId
     * @param quantiles
     * @returns PredictionEntry Successful Response
     * @throws ApiError
     */
    public getPredictionEntryV1AnalyticsPredictionEntryGet(
        predictionId: number,
        quantiles: Array<number>,
    ): CancelablePromise<Array<PredictionEntry>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/analytics/prediction-entry',
            query: {
                'predictionId': predictionId,
                'quantiles': quantiles,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * @deprecated
     * Run a one-off forecast from inline data (deprecated, use prediction setups)
     * Run a forecast against observations supplied directly in the request body — no stored dataset needed.
     *
     * Deprecated: use ``POST /v1/crud/prediction-setups/{predictionSetupId}/run`` instead.
     * Predictions made here are not linked to a prediction setup, so they cannot be
     * monitored against observed cases.
     *
     * Forecasting happens in the background; the response carries a job id you poll via
     * ``/v1/jobs/{id}`` for the result. The legacy ``data_to_be_fetched`` field is
     * rejected — supply the observations directly.
     * @param requestBody
     * @returns JobResponse Successful Response
     * @throws ApiError
     */
    public makePredictionV1AnalyticsMakePredictionPost(
        requestBody: MakePredictionRequest,
    ): CancelablePromise<JobResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/v1/analytics/make-prediction',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Read forecast quantiles for a prediction (path parameter id)
     * Path-parameter variant of ``GET /v1/analytics/prediction-entry`` for callers that prefer the id in the URL.
     *
     * Same forecast-quantile response — pick whichever URL shape your client tooling
     * handles more naturally. 404 if the prediction id is unknown.
     * @param predictionId
     * @param quantiles
     * @returns PredictionEntry Successful Response
     * @throws ApiError
     */
    public getPredictionEntriesV1AnalyticsPredictionEntryPredictionIdGet(
        predictionId: number,
        quantiles: Array<number>,
    ): CancelablePromise<Array<PredictionEntry>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/analytics/prediction-entry/{predictionId}',
            path: {
                'predictionId': predictionId,
            },
            query: {
                'quantiles': quantiles,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
