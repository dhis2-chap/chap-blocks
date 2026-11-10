import { useQuery } from '@tanstack/react-query';
import { useConnection, useDataEngine } from '@chap-blocks/runtime';

type OrganisationUnit = { id: string; displayName: string };
type OrgUnitResult = { organisationUnits: OrganisationUnit[] };
export function useOrgUnitsById(orgUnitIds: string[]) {
    const { dhis2Url } = useConnection();
    const source = useDataEngine();
    return useQuery<OrgUnitResult, Error>({
        queryKey: ['organisationUnits', dhis2Url, orgUnitIds],
        queryFn: async () => {
            let names: OrganisationUnit[] = [];
            if (dhis2Url && orgUnitIds.length) {
                const result = await source.query({ units: { resource: 'organisationUnits', params: { paging: false, fields: 'id,displayName', filter: `id:in:[${orgUnitIds.join(',')}]` } } });
                names = (result.units as OrgUnitResult).organisationUnits;
            }
            const byId = new Map(names.map(unit => [unit.id, unit.displayName]));
            return { organisationUnits: orgUnitIds.map(id => ({ id, displayName: byId.get(id) ?? id })) };
        },
        staleTime: Infinity,
    });
}
