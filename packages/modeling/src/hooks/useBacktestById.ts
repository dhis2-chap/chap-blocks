import { useChapClient } from '@chap-blocks/runtime';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, BacktestRead } from '@chap-blocks/api';
import { BACKTESTS_LIST_QUERY_KEY } from './useBacktests';

export const useBacktestById = (backtestId?: number) => {
    const chapClient = useChapClient();
    const queryClient = useQueryClient();

    const { data, error, isLoading, isFetching } = useQuery<
        BacktestRead,
        ApiError
    >({
        queryKey: [BACKTESTS_LIST_QUERY_KEY, backtestId],
        queryFn: () =>
            chapClient.backtests.getBacktestInfoV1CrudBacktestsBacktestIdInfoGet(
                backtestId!,
            ),
        initialData: () => {
            const cachedList = queryClient.getQueryData<BacktestRead[]>([
                BACKTESTS_LIST_QUERY_KEY,
            ]);
            return cachedList?.find(backtest => backtest.id === backtestId);
        },
        enabled: !!backtestId && typeof backtestId === 'number',
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        backtest: data,
        error,
        isLoading,
        isFetching,
    };
};
