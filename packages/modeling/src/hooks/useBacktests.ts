import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { ApiError, BacktestRead } from '@chap-blocks/api';

export const BACKTESTS_LIST_QUERY_KEY = 'backtests' as const;

export const useBacktests = () => {
    const chapClient = useChapClient();
    const { data, error, isLoading } = useQuery<BacktestRead[], ApiError>({
        queryKey: [BACKTESTS_LIST_QUERY_KEY],
        queryFn: () => chapClient.backtests.getBacktestsV1CrudBacktestsGet(),
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });

    return {
        backtests: data,
        error,
        isLoading,
    };
};
