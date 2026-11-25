import type { DatasetLocation } from './datasetDraft';

/** Locations by parent id. Roots, including locations whose parent is not listed, are under `''`. */
export const groupLocationsByParent = (locations: DatasetLocation[]): Map<string, DatasetLocation[]> => {
    const ids = new Set(locations.map(location => location.id));
    const children = new Map<string, DatasetLocation[]>();
    for (const location of locations) {
        const parent = location.parentId && ids.has(location.parentId) ? location.parentId : '';
        const siblings = children.get(parent);
        if (siblings) siblings.push(location);
        else children.set(parent, [location]);
    }
    return children;
};

/** The locations without children under `id`, or `id` itself when it has none. */
export const leafIdsUnder = (id: string, children: Map<string, DatasetLocation[]>): string[] => {
    const below = children.get(id);
    return below ? below.flatMap(child => leafIdsUnder(child.id, children)) : [id];
};

/** The ids a dataset can hold: every location without children, in tree order. Locations in a parent cycle are left out. */
export const getLeafLocationIds = (locations: DatasetLocation[]): string[] => leafIdsUnder('', groupLocationsByParent(locations));
