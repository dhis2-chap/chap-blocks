import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { ApiError, type PredictionInfo } from '@chap-blocks/api';

export const usePredictions = () => {
    const chapClient = useChapClient();
    const { data, error, isLoading } = useQuery<PredictionInfo[], ApiError>({
        queryKey: ['predictions'],
        queryFn: () => chapClient.predictions.getPredictionsV1CrudPredictionsGet(),
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        predictions: data,
        error,
        isLoading,
    };
};
