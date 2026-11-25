/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/**
 * One point of a scatter plot of the gap against the window size or the distance.
 */
export type SelectionBiasPoint = {
    /**
     * Window size k (splits) or distance d (splits after the window).
     */
    'x': number;
    /**
     * Mean gap of the pairs at this x, weighted by forecasts scored. On the distance plot it is adjusted to the full window size, using the fitted coefficient.
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

