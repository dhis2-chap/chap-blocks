import { useChapClient } from '@chap-blocks/runtime';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import i18n from '@dhis2/d2-i18n';

import { useAlert } from '@chap-blocks/runtime';

type Props = {
    onSuccess?: ({ id }: { id: number }) => void;
    onError?: () => void;
};

export const useDeleteBacktest = ({ onSuccess, onError }: Props = {}) => {
    const chapClient = useChapClient();
    const queryClient = useQueryClient();
    const { show: showSuccessAlert } = useAlert(
        i18n.t('Evaluation deleted'),
        { success: true },
    );

    const { show: showErrorAlert } = useAlert(
        i18n.t('Failed to delete evaluation'),
        { success: false },
    );

    const {
        mutate: deleteBacktest,
        isLoading,
        isError,
        error,
    } = useMutation({
        mutationFn: (id: number) => chapClient.backtests.deleteBacktestV1CrudBacktestsBacktestIdDelete(id),
        onSuccess: (_data, id) => {
            queryClient.invalidateQueries({ queryKey: ['backtests'] });
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
        deleteBacktest,
        isLoading,
        isError,
        error,
    };
};
