import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { ApiError, SelectionBias } from '@chap-blocks/api';
import { isValidSpecificationId } from './useBacktestSpecification';

export const useSelectionBias = (id: number, backtestIds: number[]) => {
    const chapClient = useChapClient();
    return useQuery<SelectionBias, ApiError>({
        // Recompute when the set of model runs on the benchmark changes.
        queryKey: ['backtest-specifications', id, 'selection-bias', backtestIds],
        queryFn: () => chapClient.backtests.getBacktestSpecificationSelectionBiasV1CrudBacktestSpecificationsSpecificationIdSelectionBiasGet(id),
        enabled: isValidSpecificationId(id),
        retry: false,
    });
};
