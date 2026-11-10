import { useChapClient } from '@chap-blocks/runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAlert } from '@chap-blocks/runtime';
import i18n from '@dhis2/d2-i18n';
import { ApiError, PredictionSetupRead, PredictionSetupUpdate } from '@chap-blocks/api';
import { PREDICTION_SETUPS_QUERY_KEY } from '../../../../../hooks/usePredictionSetups';

type UpdatePredictionSetupVariables = {
    predictionSetupId: number;
    data: PredictionSetupUpdate;
};

type UseUpdatePredictionSetupOptions = {
    onSuccess?: (predictionSetup: PredictionSetupRead) => void;
    onError?: (error: ApiError) => void;
};

export const useUpdatePredictionSetup = ({
    onSuccess,
    onError,
}: UseUpdatePredictionSetupOptions = {}) => {
    const chapClient = useChapClient();
    const queryClient = useQueryClient();

    const { show: showSuccessAlert } = useAlert(
        i18n.t('Prediction setup updated'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to update prediction setup'),
        { critical: true },
    );

    const mutation = useMutation<
        PredictionSetupRead,
        ApiError,
        UpdatePredictionSetupVariables
    >({
        mutationFn: ({ predictionSetupId, data }) =>
            chapClient.predictionSetups.updatePredictionSetupV1CrudPredictionSetupsPredictionSetupIdPatch(
                predictionSetupId,
                data,
            ),
        onSuccess: (predictionSetup, { predictionSetupId }) => {
            queryClient.invalidateQueries({ queryKey: [PREDICTION_SETUPS_QUERY_KEY] });
            queryClient.invalidateQueries({ queryKey: [PREDICTION_SETUPS_QUERY_KEY, predictionSetupId] });
            showSuccessAlert();
            onSuccess?.(predictionSetup);
        },
        onError: (error) => {
            showErrorAlert();
            onError?.(error);
        },
    });

    return {
        updatePredictionSetup: mutation.mutateAsync,
        isUpdating: mutation.isLoading,
        error: mutation.error,
        reset: mutation.reset,
    };
};
