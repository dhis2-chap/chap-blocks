/** Pure transformations and view-model types, safe to import without a DOM or React provider. */
export {
    evaluationResultToViewData,
    getSplitPeriod,
    createHighChartsData,
    joinRealAndPredictedData,
    normalizeEvaluationModelsToSharedPeriods,
} from './utils/EvaluationResponse';
export type {
    EvaluationEntryExtend,
    HighChartsData,
    EvaluationForSplitPoint,
    EvaluationPerOrgUnit,
    ModelData,
} from './interfaces/Evaluation';
export type {
    PredictionOrgUnitSeries,
    PredictionPointVM,
    QuantileKey,
    PredictionInfo,
} from './interfaces/Prediction';
export { buildPredictionSeries } from './utils/PredictionViewModel';
export {
    OUTBREAK_PROBABILITY_OPTIONS,
    DEFAULT_OUTBREAK_PROBABILITY,
    buildEndemicThresholdMap,
    getForecastThresholdCoverage,
    getThresholdLineRoles,
    buildOutbreakIndicators,
    buildOutbreakIndicatorsForSeries,
    getHighestSupportedOutbreakProbability,
    getQuantileKeyForOutbreakProbability,
    getSupportedOutbreakProbabilityBucket,
    isOutbreakAtProbability,
    parseOutbreakProbability,
    type EndemicThresholdPoint,
    type OutbreakIndicator,
    type OutbreakProbability,
    type SupportedOutbreakProbabilityBucket,
    type ThresholdLineRoles,
} from './utils/outbreakAlerts';
export {
    getStableMaxYForThresholdChart,
    getThresholdTileViewModels,
    type ThresholdSummary,
    type ThresholdTileStatus,
    type ThresholdTileViewModel,
} from './utils/outbreakThresholdTiles';
export { buildChartPeriods, buildPeriodIndexLookup, getSeriesPeriods } from './utils/chartPeriods';
export { getPeriodNameFromId } from './utils/Time';
export {
    plotResultsToViewData,
    getStableMaxYByOrgUnitId,
    type PlotDataResult,
} from './utils/plotDataForEvaluations';
export { monitoringSeries } from './components/predictions/MonitoringChart/monitoringSeries';
