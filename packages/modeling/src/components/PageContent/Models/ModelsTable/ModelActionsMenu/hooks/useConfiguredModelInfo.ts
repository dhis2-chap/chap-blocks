import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { ApiError, ConfiguredModelInfoRead } from '@chap-blocks/api';
import { configuredModelInfoQueryOptions } from '../../../../../../hooks/modelsQuery';

type Props = {
    id: number | null;
    enabled?: boolean;
};

export const useConfiguredModelInfo = ({ id, enabled = true }: Props) => {
    const chapClient = useChapClient();
    const { data, error, isLoading } = useQuery<ConfiguredModelInfoRead, ApiError>({
        ...configuredModelInfoQueryOptions(chapClient, id as number),
        enabled: enabled && id !== null,
    });

    return {
        info: data,
        error,
        isLoading,
    };
};
