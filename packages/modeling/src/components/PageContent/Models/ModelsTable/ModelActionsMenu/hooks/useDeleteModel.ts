import { useChapClient } from '@chap-blocks/runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';

import { useAlert } from '@chap-blocks/runtime';

type Props = {
    onSuccess?: ({ id }: { id: number }) => void;
    onError?: () => void;
};

export const useDeleteModel = ({ onSuccess, onError }: Props = {}) => {
    const chapClient = useChapClient();
    const queryClient = useQueryClient();
    const { show: showSuccessAlert } = useAlert(
        i18n.t('Model archived'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to archive model'),
        { critical: true },
    );

    const {
        mutate: deleteModel,
        isLoading,
        isError,
        error,
    } = useMutation<void, Error, number>({
        mutationFn: async (id) => {
            await chapClient.models.deleteConfiguredModelV1CrudConfiguredModelsConfiguredModelIdDelete(id);
        },
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['models'] });
            showSuccessAlert();
            onSuccess?.({ id });
        },
        onError: (error) => {
            console.error(error);
            showErrorAlert();
            onError?.();
        },
    });

    return {
        deleteModel,
        isLoading,
        isError,
        error,
    };
};
