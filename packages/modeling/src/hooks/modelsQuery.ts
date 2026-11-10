import type { ChapClient } from '@chap-blocks/api';
import { QueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { type ModelSpecRead } from '@chap-blocks/api';
import { hasRevisionMismatch, revisionMismatchOnSubmitMessage } from '../utils/modelHealth';

export const modelsQueryOptions = (chapClient: ChapClient) => ({
    queryKey: ['models'],
    queryFn: () => chapClient.models.listConfiguredModelsV1CrudConfiguredModelsGet(),
    staleTime: 30_000,
    cacheTime: Infinity,
    retry: 0,
});

export const configuredModelInfoQueryOptions = (chapClient: ChapClient, id: number) => ({
    queryKey: ['configuredModelInfo', id],
    queryFn: () => chapClient.models.getConfiguredModelInfoV1CrudConfiguredModelsConfiguredModelIdGet(id),
    staleTime: 300_000,
    cacheTime: 300_000,
    retry: 0,
});

/**
 * Health can change after selection. Re-read the model right before a job is
 * submitted, even when the form's model cache is still fresh.
 */
export const fetchRunnableModel = async (
    queryClient: QueryClient,
    modelId: number,
    chapClient: ChapClient,
): Promise<ModelSpecRead> => {
    const models = await queryClient.fetchQuery({ ...modelsQueryOptions(chapClient), staleTime: 0 });
    const model = models.find(model => model.id === modelId);

    if (!model) {
        throw new Error(i18n.t('Model not found'));
    }

    if (hasRevisionMismatch(model)) {
        throw new Error(revisionMismatchOnSubmitMessage(model));
    }

    return model;
};
