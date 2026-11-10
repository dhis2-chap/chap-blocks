import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { ApiError, PredictionInfo } from '@chap-blocks/api';

export const usePredictionById = (predictionId: string | undefined) => {
    const chapClient = useChapClient();
    const { data, error, isLoading, isFetching, isError } = useQuery<PredictionInfo, ApiError>({
        queryKey: ['prediction', predictionId],
        queryFn: () => chapClient.predictions.getPredictionV1CrudPredictionsPredictionIdGet(predictionId as unknown as number),
        enabled: !!predictionId,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    return {
        prediction: data,
        error,
        isLoading: isLoading || isFetching,
        isError,
    };
};
