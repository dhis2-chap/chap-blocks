type Position = [number, number];
type Polygon = Position[][];

export type Boundary = { id: string; name: string; polygons: Polygon[] };
export type Boundaries = { regions: Boundary[]; names: Map<string, string> };

type RawFeature = {
    id?: string | number;
    properties?: Record<string, unknown> | null;
    geometry?: { type?: string; coordinates?: unknown } | null;
};

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value : undefined);

/**
 * Reads the GeoJSON Chap stores with a dataset. Region ids follow the modeling
 * package's datasetGeometry; names prefer the DHIS2 display name when present.
 */
export const parseBoundaries = (json: string | null | undefined): Boundaries => {
    const empty: Boundaries = { regions: [], names: new Map() };
    if (!json) return empty;
    let collection: { type?: string; features?: RawFeature[] };
    try {
        collection = JSON.parse(json);
    } catch {
        return empty;
    }
    if (collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) return empty;
    const regions = collection.features.flatMap((feature): Boundary[] => {
        const props = feature.properties ?? {};
        const id = String(feature.id ?? props.id ?? props.NAME_1 ?? '');
        if (!id) return [];
        const name = text(props.displayName) ?? text(props.name) ?? text(props.NAME_1) ?? id;
        const { type, coordinates } = feature.geometry ?? {};
        const polygons = type === 'Polygon'
            ? [coordinates as Polygon]
            : type === 'MultiPolygon' ? coordinates as Polygon[] : [];
        return [{ id, name, polygons: polygons.filter(Array.isArray) }];
    });
    return { regions, names: new Map(regions.map(region => [region.id, region.name])) };
};

/** Equirectangular projection scaled to the regions' bounding box; adequate at country scale. */
export const projectBoundaries = (regions: Boundary[], width: number) => {
    const points = regions.flatMap(region => region.polygons.flat(2));
    if (!points.length) return { height: 0, paths: new Map<string, string>() };
    // A loop, not Math.min(...values): spreading a detailed boundary file overflows the call stack.
    let [minLon, maxLon, minLat, maxLat] = [Infinity, -Infinity, Infinity, -Infinity];
    for (const [lon, lat] of points) {
        if (lon < minLon) minLon = lon;
        if (lon > maxLon) maxLon = lon;
        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
    }
    const xScale = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    const spanX = Math.max((maxLon - minLon) * xScale, 1e-9);
    const spanY = Math.max(maxLat - minLat, 1e-9);
    const scale = width / spanX;
    const height = Math.round(spanY * scale);
    const paths = new Map(regions.map(region => [region.id, region.polygons.map(polygon => polygon.map(ring => ring
        .map(([lon, lat], index) => `${index ? 'L' : 'M'}${((lon - minLon) * xScale * scale).toFixed(1)},${((maxLat - lat) * scale).toFixed(1)}`)
        .join('') + 'Z').join('')).join('')]));
    return { height, paths };
};
