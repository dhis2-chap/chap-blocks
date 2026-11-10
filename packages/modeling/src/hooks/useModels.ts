import { useChapClient } from '@chap-blocks/runtime';
import { ApiError, ModelSpecRead } from '@chap-blocks/api';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { modelsQueryOptions } from './modelsQuery';

type Props = {
    includeArchived?: boolean;
};

export const useModels = ({ includeArchived = false }: Props = {}) => {
    const chapClient = useChapClient();
    const { data, error, isLoading } = useQuery<ModelSpecRead[], ApiError>(modelsQueryOptions(chapClient));

    const models = useMemo(
        () => includeArchived ? data : data?.filter(model => !model.archived),
        [data, includeArchived],
    );

    return {
        models,
        // A failed background refresh (remount or submit preflight) keeps the
        // cached models. Only report errors when there is nothing to show, so
        // open forms are not replaced by an error screen.
        error: data ? null : error,
        isLoading,
    };
};
