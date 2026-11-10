import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@chap-blocks/api';

export type IsolatedPlotsRequestBody = {
    location?: string;
    split_period?: string;
    horizon_distance?: number;
};

type UseIsolatedPlotsParams = {
    visualizationName?: string;
    backtestId?: number;
    requestBody?: IsolatedPlotsRequestBody;
};

export const useIsolatedPlots = ({
    visualizationName,
    backtestId,
    requestBody,
}: UseIsolatedPlotsParams) => {
    const chapClient = useChapClient();
    const { data, isLoading, isFetching, error } = useQuery<unknown, ApiError>({
        queryKey: [
            'isolated-plots',
            backtestId,
            visualizationName,
            requestBody,
        ],
        queryFn: () =>
            chapClient.visualizations.generateIsolatedPlotsV1VisualizationBacktestPlotsVisualizationNameBacktestIdSubplotPost(
                visualizationName!,
                Number(backtestId),
                requestBody || {},
            ),
        enabled:
            typeof backtestId === 'number' &&
            backtestId > 0 &&
            !!visualizationName &&
            !!requestBody,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
        refetchOnWindowFocus: false,
    });

    return {
        plotsData: data,
        isLoading,
        isFetching,
        error,
    };
};
