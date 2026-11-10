import { useChapClient } from '@chap-blocks/runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';
import { useAlert } from '@chap-blocks/runtime';
import { ApiError, ModelConfigurationCreate, ConfiguredModelDB } from '@chap-blocks/api';

type UseCreateModelOptions = {
    onSuccess?: (model: ConfiguredModelDB) => void;
    onError?: (error: ApiError) => void;
};

export const useCreateModel = ({ onSuccess, onError }: UseCreateModelOptions = {}) => {
    const chapClient = useChapClient();
    const queryClient = useQueryClient();

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Model created successfully'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to create model'),
        { critical: true },
    );

    const mutation = useMutation<ConfiguredModelDB, ApiError, ModelConfigurationCreate>({
        mutationFn: payload => chapClient.models.addConfiguredModelV1CrudConfiguredModelsPost(payload),
        onSuccess: (model) => {
            queryClient.invalidateQueries({ queryKey: ['models'] });
            showSuccessAlert();
            onSuccess?.(model);
        },
        onError: (error) => {
            showErrorAlert();
            onError?.(error);
        },
    });

    return {
        createModel: mutation.mutateAsync,
        isCreating: mutation.isLoading,
        error: mutation.error,
        reset: mutation.reset,
    };
};
