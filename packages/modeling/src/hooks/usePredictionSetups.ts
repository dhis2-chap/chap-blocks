import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { ApiError, PredictionSetupRead } from '@chap-blocks/api';

export const PREDICTION_SETUPS_QUERY_KEY = 'predictionSetups' as const;

type UsePredictionSetupsOptions = {
    enabled?: boolean;
};

export const usePredictionSetups = ({
    enabled = true,
}: UsePredictionSetupsOptions = {}) => {
    const chapClient = useChapClient();
    const { data, error, isLoading } = useQuery<PredictionSetupRead[], ApiError>({
        queryKey: [PREDICTION_SETUPS_QUERY_KEY],
        queryFn: () =>
            chapClient.predictionSetups.listPredictionSetupsV1CrudPredictionSetupsGet(),
        enabled,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        predictionSetups: data,
        error,
        isLoading,
    };
};
