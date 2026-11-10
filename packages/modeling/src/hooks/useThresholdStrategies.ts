import { useChapClient } from '@chap-blocks/runtime';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, type ThresholdStrategyInfo } from '@chap-blocks/api';
import { isKnownThresholdStrategy } from '../utils/thresholdStrategyParams';

export const useThresholdStrategies = () => {
    const chapClient = useChapClient();
    const { data, error, isLoading, refetch } = useQuery<ThresholdStrategyInfo[], ApiError>({
        queryKey: ['threshold-strategies'],
        queryFn: () => chapClient.datasets.listThresholdStrategyTypesV1AnalyticsThresholdsStrategiesGet(),
        staleTime: Infinity,
        cacheTime: Infinity,
        retry: 0,
    });

    // The backend catalogue can advertise strategies this frontend has no params
    // config (and no generated request type) for; requesting those would 422.
    const thresholdStrategies = useMemo(() => (
        data?.filter(strategy => isKnownThresholdStrategy(strategy.id))
    ), [data]);

    return {
        thresholdStrategies,
        error,
        isLoading,
        refetch,
    };
};
