import { useChapClient } from '@chap-blocks/runtime';
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError, BacktestPlotType } from '@chap-blocks/api';

export const useCustomEvaluationPlotTypes = () => {
    const chapClient = useChapClient();
    const { data, error, isLoading } = useQuery<BacktestPlotType[], ApiError>({
        queryKey: ['custom-evaluation-plot-types'],
        queryFn: () => chapClient.visualizations.listBacktestPlotTypesV1VisualizationBacktestPlotsGet(),
        staleTime: 5 * 60 * 1000,
        cacheTime: 5 * 60 * 1000,
        retry: 0,
    });

    useEffect(() => {
        if (!error) return;
        console.error('useCustomEvaluationPlotTypes: error loading custom evaluation plot types', {
            message: error?.message,
            error,
        });
    }, [error]);

    return {
        customEvaluationPlotTypes: data,
        error,
        isLoading,
    };
};
