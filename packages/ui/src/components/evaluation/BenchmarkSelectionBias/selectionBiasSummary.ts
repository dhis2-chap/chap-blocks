import type { SelectionBias } from '@chap-blocks/api';

export type SelectionBiasSummaryValues = {
    /** Name of the model picked on all split points, if the response or the caller knows it. */
    pickedName?: string;
    validationValue: number;
    estimatedBias: number;
    estimatedValue: number;
};

/**
 * The four numbers of a selection-bias summary: the picked model, its value on the benchmark, the estimated bias and
 * the value to expect on new data. `pickedName` wins over the candidate's name in the response.
 */
export const selectionBiasSummary = (selectionBias: SelectionBias, pickedName?: string): SelectionBiasSummaryValues => {
    const picked = selectionBias.candidates.find(candidate => candidate.backtestId === selectionBias.selectedBacktestId);
    return {
        pickedName: pickedName ?? picked?.modelName,
        validationValue: selectionBias.validationValue,
        estimatedBias: selectionBias.estimatedBias,
        estimatedValue: selectionBias.estimatedValue,
    };
};
