/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BacktestPlotType } from '../models/BacktestPlotType';
import type { DatasetPlotType } from '../models/DatasetPlotType';
import type { MetricInfo } from '../models/MetricInfo';
import type { VisualizationInfo } from '../models/VisualizationInfo';
import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';
export class VisualizationsService {
    constructor(public readonly httpRequest: BaseHttpRequest) {}
    /**
     * Discover which metric plots are available
     * List the metric-plot styles you can render against a backtest's forecasts (line chart of CRPS over time, choropleth of MAE, ...).
     *
     * Use this to populate a plot picker in a UI or to find out which
     * ``/metric-plots/{name}/...`` URLs are valid. The result is the same regardless of
     * ``backtest_id`` — the path takes it for symmetry with the render endpoint.
     * @param backtestId
     * @returns VisualizationInfo Successful Response
     * @throws ApiError
     */
    public getAvilableMetricPlotsV1VisualizationMetricPlotsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<VisualizationInfo>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/visualization/metric-plots/{backtest_id}',
            path: {
                'backtest_id': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Discover which scoring metrics are available
     * List the metrics you can score a backtest with (CRPS, MAE, ...), with a human-friendly name, description, optimization direction, unit and target for each.
     *
     * Use this to populate a metric picker in a UI before requesting a specific plot. The
     * result is the same regardless of ``backtest_id`` — the path takes it for symmetry
     * with the render endpoint.
     * @param backtestId
     * @returns MetricInfo Successful Response
     * @throws ApiError
     */
    public getAvailableMetricsV1VisualizationMetricsBacktestIdGet(
        backtestId: number,
    ): CancelablePromise<Array<MetricInfo>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/visualization/metrics/{backtest_id}',
            path: {
                'backtest_id': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Render a metric plot for a backtest
     * Score a backtest with the chosen metric (CRPS, MAE, ...) and render the result as the chosen plot style.
     *
     * The response is a Vega/Vega-Lite spec you can hand straight to a frontend renderer.
     * 404 if the backtest or plot style is unknown; 400 if the metric id is not one of the
     * registered metrics.
     * @param visualizationName
     * @param backtestId
     * @param metricId
     * @returns any Successful Response
     * @throws ApiError
     */
    public generateVisualizationV1VisualizationMetricPlotsVisualizationNameBacktestIdMetricIdGet(
        visualizationName: string,
        backtestId: number,
        metricId: string,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/visualization/metric-plots/{visualization_name}/{backtest_id}/{metric_id}',
            path: {
                'visualization_name': visualizationName,
                'backtest_id': backtestId,
                'metric_id': metricId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Discover which dataset plots are available
     * List the visualizations you can render against an imported dataset (observation time-series per region, polygon overlays, ...).
     *
     * Use this to populate a plot picker before requesting a specific
     * ``/dataset-plots/{name}/{datasetId}`` URL.
     * @returns DatasetPlotType Successful Response
     * @throws ApiError
     */
    public listDatasetPlotTypesV1VisualizationDatasetPlotsGet(): CancelablePromise<Array<DatasetPlotType>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/visualization/dataset-plots/',
        });
    }
    /**
     * Render a plot of a dataset
     * Render the chosen visualization for a dataset — used to inspect observations before training, spot gaps in the data, or share a quick view of what got imported.
     *
     * The response is a JSON plot spec the frontend can render directly. 404 if the
     * dataset or plot style is unknown; the error message lists the registered styles.
     * @param visualizationName
     * @param datasetId
     * @returns any Successful Response
     * @throws ApiError
     */
    public generateDataPlotsV1VisualizationDatasetPlotsVisualizationNameDatasetIdGet(
        visualizationName: string,
        datasetId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/visualization/dataset-plots/{visualization_name}/{dataset_id}',
            path: {
                'visualization_name': visualizationName,
                'dataset_id': datasetId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Discover which backtest plots are available
     * List the visualizations you can render against a backtest's forecasts (forecast vs. actuals per region, calibration plots, ...).
     *
     * Use this to populate a plot picker before requesting a specific
     * ``/backtest-plots/{name}/{backtestId}`` URL.
     * @returns BacktestPlotType Successful Response
     * @throws ApiError
     */
    public listBacktestPlotTypesV1VisualizationBacktestPlotsGet(): CancelablePromise<Array<BacktestPlotType>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/visualization/backtest-plots/',
        });
    }
    /**
     * Render a forecast plot for a backtest
     * Render the chosen visualization for a backtest's forecasts — used to assess model performance, identify regions where forecasts diverge from actuals, or share an evaluation result.
     *
     * The response is a Vega plot spec the frontend can render directly. Returns 404 if
     * the backtest or plot style is unknown; the error message lists the registered
     * styles.
     * @param visualizationName
     * @param backtestId
     * @returns any Successful Response
     * @throws ApiError
     */
    public generateBacktestPlotsV1VisualizationBacktestPlotsVisualizationNameBacktestIdGet(
        visualizationName: string,
        backtestId: number,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/visualization/backtest-plots/{visualization_name}/{backtest_id}',
            path: {
                'visualization_name': visualizationName,
                'backtest_id': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Get Facet Coordinates
     * Returns unique structural dimension arrays available for layout faceting grids.
     * @param visualizationName
     * @param backtestId
     * @returns any Successful Response
     * @throws ApiError
     */
    public getFacetCoordinatesV1VisualizationBacktestPlotsVisualizationNameBacktestIdFacetCoordsGet(
        visualizationName: string,
        backtestId: number,
    ): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/visualization/backtest-plots/{visualization_name}/{backtest_id}/facet-coords',
            path: {
                'visualization_name': visualizationName,
                'backtest_id': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate Isolated Plots
     * Filters the source datasets by exact coordinate targets and generates a single Vega schema spec.
     * @param visualizationName
     * @param backtestId
     * @param requestBody
     * @returns any Successful Response
     * @throws ApiError
     */
    public generateIsolatedPlotsV1VisualizationBacktestPlotsVisualizationNameBacktestIdSubplotPost(
        visualizationName: string,
        backtestId: number,
        requestBody: Record<string, any>,
    ): CancelablePromise<any> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/v1/visualization/backtest-plots/{visualization_name}/{backtest_id}/subplot',
            path: {
                'visualization_name': visualizationName,
                'backtest_id': backtestId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                422: `Validation Error`,
            },
        });
    }
    /**
     * Generate All Subplots
     * Generates a full flat checklist mapping coordinate variations against their respective Vega specs.
     * @param visualizationName
     * @param backtestId
     * @returns any Successful Response
     * @throws ApiError
     */
    public generateAllSubplotsV1VisualizationBacktestPlotsVisualizationNameBacktestIdSubplotsGet(
        visualizationName: string,
        backtestId: number,
    ): CancelablePromise<Array<Record<string, any>>> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/v1/visualization/backtest-plots/{visualization_name}/{backtest_id}/subplots',
            path: {
                'visualization_name': visualizationName,
                'backtest_id': backtestId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }
}
