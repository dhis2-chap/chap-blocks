import type { FeatureCollection } from '@chap-blocks/ui/maps';
/** Normalize stored GeoJSON to the plotting library's location shape. */
export function datasetGeometry(
    json: string | null | undefined,
    orgUnitIds: string[],
): FeatureCollection {
    if (!json) throw new Error('This dataset does not contain map boundaries.');
    const geometry = JSON.parse(json);
    if (
        geometry.type !== 'FeatureCollection' ||
        !Array.isArray(geometry.features)
    )
        throw new Error('Invalid dataset GeoJSON.');
    const wanted = new Set(orgUnitIds);
    const features = geometry.features
        .map(
            (feature: {
                id?: string | number;
                properties?: Record<string, unknown>;
                geometry: unknown;
            }) => {
                const id = String(
                    feature.id ??
                        feature.properties?.id ??
                        feature.properties?.NAME_1 ??
                        '',
                );
                return {
                    ...feature,
                    type: 'Feature',
                    id,
                    properties: {
                        name: String(
                            feature.properties?.name ??
                                feature.properties?.NAME_1 ??
                                id,
                        ),
                    },
                };
            },
        )
        .filter((feature: { id: string }) => wanted.has(feature.id));
    if (!features.length)
        throw new Error('No dataset boundaries match the forecast locations.');
    return { type: 'FeatureCollection', features };
}
