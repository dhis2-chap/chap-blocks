/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One point of a scatter plot of the pick's optimism against the window size or the distance.
 */
export type SelectionBiasPoint = {
    /**
     * Window size k (splits) or distance d (splits after the window).
     */
    'x': number;
    /**
     * Mean optimism of the pairs at this x, weighted by forecasts scored. On the window-size plot it is adjusted to distance 0, and on the distance plot to the full window size, using the fitted coefficients.
     */
    value: number;
    /**
     * The fitted line at this x.
     */
    fitted: number;
    /**
     * Number of (validation window, test split) pairs at this x.
     */
    nPairs: number;
};

