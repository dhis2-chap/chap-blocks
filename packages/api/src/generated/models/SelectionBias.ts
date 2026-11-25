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
     * Horizon distances whose forecasts were scored.
     */
    horizonDistances: Array<number>;
    /**
     * Splits left out between each validation window and its first test split, so the two share no target period: the largest minus the smallest horizon distance scored.
     */
    gapSplits: number;
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
     * Fitted gap at the full window size: how much of the picked model's lead is expected to be luck. Zero when every validation window picks the same model.
     */
    estimatedBias: number;
    /**
     * Estimated comparison on new data: validationValue - estimatedBias.
     */
    estimatedValue: number;
    /**
     * Mean gap over all pairs, weighted by forecasts scored. Higher than the estimated bias, because most pairs have short windows.
     */
    meanGap: number;
    /**
     * Number of (validation window, test split) pairs.
     */
    nPairs: number;
    /**
     * Number of validation windows.
     */
    nWindows: number;
    /**
     * Number of validation windows that pick another model than the final one.
     */
    nWindowsOtherPick: number;
    coefficients: SelectionBiasCoefficients;
    /**
     * Gap against window size k.
     */
    windowSizePoints: Array<SelectionBiasPoint>;
    /**
     * Gap against distance d, at the full window size. A check: it should be flat.
     */
    distancePoints: Array<SelectionBiasPoint>;
};

