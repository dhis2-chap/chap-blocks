import { useConnection } from '@chap-blocks/runtime';
import { useApiDataQuery } from '../utils/useApiDataQuery';

type User = {
    id: string;
    username: string;
    displayName: string;
    authorities: string[];
};

export const useLoggedInUser = () => {
    const { dhis2Url } = useConnection();
    const fields = 'id,username,displayName,authorities';

    const { data, isLoading, error } = useApiDataQuery<User, Error, User>({
        queryKey: ['me', dhis2Url, fields],
        enabled: !!dhis2Url,
        query: {
            resource: 'me',
            params: {
                fields,
            },
        },
        staleTime: Infinity,
        cacheTime: Infinity,
        refetchOnWindowFocus: false,
    });

    return {
        user: data,
        isLoading: !!dhis2Url && isLoading,
        error,
    };
};
