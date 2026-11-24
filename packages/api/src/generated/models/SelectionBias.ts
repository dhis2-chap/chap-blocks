/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { SelectionBiasCandidate } from './SelectionBiasCandidate';
import type { SelectionBiasCoefficients } from './SelectionBiasCoefficients';
import type { SelectionBiasPoint } from './SelectionBiasPoint';
/**
 * Estimated selection bias of the best model on a specification, with the data for its two plots.
 */
export type SelectionBias = {
    /**
     * Id of the metric that was compared with the baseline.
     */
    metricId: string;
    /**
     * Name of the baseline model the values are compared with.
     */
    baselineModel: string;
    /**
     * One-line description of what the comparison values mean.
     */
    comparisonDescription: string;
    /**
     * Horizon distance whose forecasts were scored.
     */
    horizonDistance: number;
    /**
     * Number of future splits the bias is averaged over.
     */
    futureSplits: number;
    /**
     * Split points used, in order: the periods each split predicted from.
     */
    splitPeriods: Array<string>;
    /**
     * Every candidate model, best first.
     */
    candidates: Array<SelectionBiasCandidate>;
    /**
     * Backtest of the model picked on all split points.
     */
    selectedBacktestId: number;
    /**
     * The picked model's comparison with the baseline over all split points.
     */
    validationValue: number;
    /**
     * Fitted optimism of the picked model, averaged over the next `futureSplits` splits.
     */
    estimatedBias: number;
    /**
     * Estimated comparison on new data: validationValue - estimatedBias.
     */
    estimatedValue: number;
    /**
     * Mean optimism over all pairs, weighted by forecasts scored. Less noisy than the fit, but biased upwards because most pairs have short windows.
     */
    meanOptimism: number;
    /**
     * Number of (validation window, test split) pairs.
     */
    nPairs: number;
    coefficients: SelectionBiasCoefficients;
    /**
     * Optimism against window size k, at distance 0.
     */
    windowSizePoints: Array<SelectionBiasPoint>;
    /**
     * Optimism against distance d, at the full window size.
     */
    distancePoints: Array<SelectionBiasPoint>;
};

