import { useConnection } from '@chap-blocks/runtime';
import { useApiDataQuery } from '../utils/useApiDataQuery';

type DataItem = {
    id: string;
    displayName: string;
};

type DataItemsResult = {
    dataItems: DataItem[];
};

export const useDataItemById = (id: string | undefined) => {
    const { dhis2Url } = useConnection();
    const { data, error, isLoading } = useApiDataQuery<
        DataItemsResult,
        Error,
        DataItem | undefined
    >({
        queryKey: ['dataItem', id],
        enabled: !!id && !!dhis2Url,
        query: {
            resource: 'dataItems',
            params: {
                fields: ['id', 'displayName'],
                filter: `id:eq:${id}`,
            },
        },
        select: (result: DataItemsResult) => {
            return result.dataItems[0];
        },
        staleTime: Infinity,
        cacheTime: Infinity,
    });

    return {
        dataItem: data,
        error,
        isLoading: !!id && !!dhis2Url && isLoading,
    };
};
