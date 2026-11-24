/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * Coefficients of optimism = intercept + inverse_sqrt_k / sqrt(k) + distance * d.
 */
export type SelectionBiasCoefficients = {
    /**
     * Optimism of an infinitely long window at distance 0.
     */
    intercept: number;
    /**
     * Selection effect: coefficient of 1 / sqrt(window size).
     */
    inverseSqrtK: number;
    /**
     * Drift: change in optimism per split between the window and the test split.
     */
    distance: number;
};

