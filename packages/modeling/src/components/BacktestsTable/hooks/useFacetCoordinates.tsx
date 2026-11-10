import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@chap-blocks/api';

export type FacetCoordinates = {
    split_period?: string[];
    location?: string[];
    horizon_distance?: number[];
};

type UseFacetCoordinatesParams = {
    backtestId?: number;
    visualizationName?: string;
};

export const useFacetCoordinates = ({
    backtestId,
    visualizationName,
}: UseFacetCoordinatesParams) => {
    const chapClient = useChapClient();
    const { data, isLoading, isFetching, error } = useQuery<FacetCoordinates, ApiError>({
        queryKey: [
            'facet-coordinates',
            backtestId,
            visualizationName,
        ],
        queryFn: () =>
            chapClient.visualizations.getFacetCoordinatesV1VisualizationBacktestPlotsVisualizationNameBacktestIdFacetCoordsGet(
                visualizationName!,
                Number(backtestId),
            ),
        enabled:
            typeof backtestId === 'number' &&
            backtestId > 0 &&
            !!visualizationName,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
        refetchOnWindowFocus: false,
    });

    return {
        facetCoordinates: data,
        isLoading,
        isFetching,
        error,
    };
};
