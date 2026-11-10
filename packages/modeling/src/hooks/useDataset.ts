import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';
import { ApiError, DataSetWithObservations } from '@chap-blocks/api';

export const useDataset = (datasetId?: number) => {
    const chapClient = useChapClient();
    return useQuery<DataSetWithObservations, ApiError>({
    queryKey: ['dataset', datasetId],
    queryFn: () => chapClient.datasets.getDatasetV1CrudDatasetsDatasetIdGet(datasetId!),
    enabled: datasetId != null && Number.isFinite(datasetId),
    staleTime: 5 * 60 * 1000,
    retry: false,
});
};
