export type Position = [number, number, ...number[]];

export type BoundaryGeometry =
    | { type: 'Point'; coordinates: Position }
    | { type: 'MultiPoint'; coordinates: Position[] }
    | { type: 'Polygon'; coordinates: Position[][] }
    | { type: 'MultiPolygon'; coordinates: Position[][][] };

export type Boundary = {
    /** The feature's NAME_1 property, which Chap matches to the CSV location column. */
    name: string;
    geometry: BoundaryGeometry | null;
};

export type ParsedBoundaries = {
    boundaries: Boundary[];
    /** Problems that make the file unusable. */
    error?: string;
    /** 0-based indexes of features without a NAME_1 property. */
    unnamed: number[];
    /** Features whose geometry is missing or not a point/polygon type. */
    withoutGeometry: string[];
};

const GEOMETRY_TYPES = new Set(['Point', 'MultiPoint', 'Polygon', 'MultiPolygon']);

type RawFeature = { type?: unknown; properties?: Record<string, unknown> | null; geometry?: { type?: unknown; coordinates?: unknown } | null };

/** Reads a GeoJSON FeatureCollection as Chap's CSV import does: one boundary per NAME_1. */
export const parseBoundaries = (text: string): ParsedBoundaries => {
    const empty = { boundaries: [], unnamed: [], withoutGeometry: [] };
    let json: unknown;
    try {
        json = JSON.parse(text.replace(/^﻿/, ''));
    } catch (error) {
        return { ...empty, error: `The file is not valid JSON: ${(error as Error).message}` };
    }
    const collection = json as { type?: unknown; features?: unknown };
    if (!collection || typeof collection !== 'object' || collection.type !== 'FeatureCollection' || !Array.isArray(collection.features)) {
        return { ...empty, error: 'The file must be a GeoJSON FeatureCollection.' };
    }
    if (!collection.features.length) {
        return { ...empty, error: 'The FeatureCollection has no features.' };
    }

    const result: ParsedBoundaries = { boundaries: [], unnamed: [], withoutGeometry: [] };
    (collection.features as RawFeature[]).forEach((feature, index) => {
        const rawName = feature?.properties?.NAME_1;
        const name = typeof rawName === 'string' || typeof rawName === 'number' ? String(rawName).trim() : '';
        if (!name) {
            result.unnamed.push(index);
            return;
        }
        const geometry = feature.geometry;
        const valid = geometry && typeof geometry.type === 'string' && GEOMETRY_TYPES.has(geometry.type) && Array.isArray(geometry.coordinates);
        if (!valid) result.withoutGeometry.push(name);
        result.boundaries.push({ name, geometry: valid ? geometry as BoundaryGeometry : null });
    });
    return result;
};
