/** A place to choose. With `parentId`, places form a hierarchy, such as DHIS2 org units. */
export type LocationOption = { id: string; name: string; parentId?: string };

/** Locations by parent id. Roots, including locations whose parent is not listed, are under `''`. */
export const groupLocationsByParent = (locations: LocationOption[]): Map<string, LocationOption[]> => {
    const ids = new Set(locations.map(location => location.id));
    const children = new Map<string, LocationOption[]>();
    for (const location of locations) {
        const parent = location.parentId && ids.has(location.parentId) ? location.parentId : '';
        const siblings = children.get(parent);
        if (siblings) siblings.push(location);
        else children.set(parent, [location]);
    }
    return children;
};

/** The locations without children under `id`, or `id` itself when it has none. */
export const leafIdsUnder = (id: string, children: Map<string, LocationOption[]>): string[] => {
    const below = children.get(id);
    return below ? below.flatMap(child => leafIdsUnder(child.id, children)) : [id];
};

/** The ids a dataset can hold: every location without children, in tree order. Locations in a parent cycle are left out. */
export const getLeafLocationIds = (locations: LocationOption[]): string[] => leafIdsUnder('', groupLocationsByParent(locations));
