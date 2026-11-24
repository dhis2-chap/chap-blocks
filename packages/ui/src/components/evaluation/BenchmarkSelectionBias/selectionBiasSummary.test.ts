import { describe, expect, it } from 'vitest';
import type { SelectionBias } from '@chap-blocks/api';
import { selectionBiasSummary } from './selectionBiasSummary';

const response = {
    selectedBacktestId: 2,
    candidates: [
        { backtestId: 1, configuredModelId: 10, modelName: 'arima', validationValue: 0.1 },
        { backtestId: 2, configuredModelId: 11, modelName: 'ewars', validationValue: 0.2 },
    ],
    validationValue: 0.2,
    estimatedBias: 0.05,
    estimatedValue: 0.15,
} as SelectionBias;

describe('selectionBiasSummary', () => {
    it('names the candidate whose backtest was picked and passes the values through', () => {
        expect(selectionBiasSummary(response)).toEqual({ pickedName: 'ewars', validationValue: 0.2, estimatedBias: 0.05, estimatedValue: 0.15 });
    });

    it('prefers the name the caller gives', () => {
        expect(selectionBiasSummary(response, 'EWARS, monthly').pickedName).toBe('EWARS, monthly');
    });

    it('leaves the name out when the picked backtest is not among the candidates', () => {
        expect(selectionBiasSummary({ ...response, selectedBacktestId: 9 }).pickedName).toBeUndefined();
    });
});
