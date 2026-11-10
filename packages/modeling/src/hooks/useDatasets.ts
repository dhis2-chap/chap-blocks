import { useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';

export const useDatasets = () => {
    const chapClient = useChapClient();
    return useQuery({
    queryKey: ['datasets'],
    queryFn: () => chapClient.datasets.getDatasetsV1CrudDatasetsGet(),
});
};
