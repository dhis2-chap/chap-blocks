import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { ApiError, ModelTemplateRead } from '@chap-blocks/api';

export const useModelTemplates = () => {
    const chapClient = useChapClient();
    const { data: modelTemplates, error, isLoading } = useQuery<ModelTemplateRead[], ApiError>({
        queryKey: ['modelTemplates'],
        queryFn: () => chapClient.models.listModelTemplatesV1CrudModelTemplatesGet(),
        retry: 0,
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
    });

    return {
        modelTemplates,
        error,
        isLoading,
    };
};
