import { useQuery } from '@tanstack/react-query';
import { parseOrgUnits, type FeatureCollection } from '@chap-blocks/ui';
import { useChapClient, useConnection, useDataEngine } from '@chap-blocks/runtime';
import { datasetGeometry } from '../utils/datasetGeometry';
export function useOrgUnitGeometry(orgUnitIds: string[], datasetId?: number) {
    const client = useChapClient();
    const { dhis2Url } = useConnection();
    const source = useDataEngine();
    const query = useQuery<FeatureCollection, Error>({
        queryKey: ['orgUnitGeometry', datasetId, dhis2Url, orgUnitIds],
        queryFn: async () => {
            if (datasetId !== undefined) {
                const dataset = await client.datasets.getDatasetV1CrudDatasetsDatasetIdGet(datasetId);
                return datasetGeometry(dataset.geojson, orgUnitIds);
            }
            if (!dhis2Url) throw new Error('Select a dataset with stored boundaries to display the map.');
            const result = await source.query({ geometry: { resource: 'geoFeatures.json', params: { ou: 'ou:' + orgUnitIds.join(';') } } });
            return parseOrgUnits(result.geometry as Parameters<typeof parseOrgUnits>[0]);
        },
        enabled: orgUnitIds.length > 0,
        staleTime: Infinity,
    });
    return { orgUnits: query.data, loading: orgUnitIds.length > 0 && query.isLoading, error: query.error };
}
