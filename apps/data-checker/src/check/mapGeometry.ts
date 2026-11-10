import type { BoundaryGeometry, Position } from './geojson';

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

const positionsOf = (geometry: BoundaryGeometry): Position[] => {
    switch (geometry.type) {
        case 'Point': return [geometry.coordinates];
        case 'MultiPoint': return geometry.coordinates;
        case 'Polygon': return geometry.coordinates.flat();
        case 'MultiPolygon': return geometry.coordinates.flat(2);
    }
};

const isPosition = (value: unknown): value is Position => (
    Array.isArray(value) && Number.isFinite(value[0]) && Number.isFinite(value[1])
);

/** Bounding box of every valid position, or null when there is none. */
export const getBounds = (geometries: (BoundaryGeometry | null)[]): Bounds | null => {
    let bounds: Bounds | null = null;
    geometries.forEach((geometry) => {
        if (!geometry) return;
        positionsOf(geometry).filter(isPosition).forEach(([x, y]) => {
            bounds = bounds
                ? { minX: Math.min(bounds.minX, x), minY: Math.min(bounds.minY, y), maxX: Math.max(bounds.maxX, x), maxY: Math.max(bounds.maxY, y) }
                : { minX: x, minY: y, maxX: x, maxY: y };
        });
    });
    return bounds;
};

export type Projection = {
    width: number;
    height: number;
    project: (position: Position) => [number, number];
};

/**
 * Equirectangular projection that fits the bounds into `width` pixels wide, scaling
 * longitude by the cosine of the middle latitude so shapes keep roughly their proportions.
 */
export const createProjection = (bounds: Bounds, width: number, padding = 8): Projection => {
    const middleLatitude = ((bounds.minY + bounds.maxY) / 2) * Math.PI / 180;
    const xScale = Math.max(Math.cos(middleLatitude), 0.1);
    const spanX = Math.max((bounds.maxX - bounds.minX) * xScale, 1e-6);
    const spanY = Math.max(bounds.maxY - bounds.minY, 1e-6);
    const inner = width - padding * 2;
    const scale = inner / Math.max(spanX, spanY * 0.5);
    const height = Math.max(Math.round(spanY * scale + padding * 2), 80);
    const offsetY = (height - spanY * scale) / 2;
    const offsetX = (width - spanX * scale) / 2;
    return {
        width,
        height,
        project: ([x, y]) => [
            Math.round(((x - bounds.minX) * xScale * scale + offsetX) * 10) / 10,
            Math.round(((bounds.maxY - y) * scale + offsetY) * 10) / 10,
        ],
    };
};

const ringPath = (ring: Position[], project: Projection['project']) => {
    if (!Array.isArray(ring)) return '';
    const points = ring.filter(isPosition).map(project);
    return points.length ? `M${points.map(([x, y]) => `${x},${y}`).join('L')}Z` : '';
};

/** SVG path data for polygons; null for point geometries (draw those as circles). */
export const toSvgPath = (geometry: BoundaryGeometry, projection: Projection): string | null => {
    if (geometry.type === 'Polygon') return geometry.coordinates.map(ring => ringPath(ring, projection.project)).join('');
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.flatMap(polygon => (Array.isArray(polygon) ? polygon : []).map(ring => ringPath(ring, projection.project))).join('');
    return null;
};

/** Projected points for point geometries. */
export const toSvgPoints = (geometry: BoundaryGeometry, projection: Projection): [number, number][] => (
    geometry.type === 'Point' || geometry.type === 'MultiPoint'
        ? positionsOf(geometry).filter(isPosition).map(projection.project)
        : []
);
