import { describe, expect, it } from 'vitest';
import { datasetGeometry } from './datasetGeometry';
const geometry = { type: 'Polygon', coordinates: [[[30, -2], [31, -2], [31, -1], [30, -2]]] };
describe('standalone map geometry', () => {
    it('uses stored feature IDs and labels and filters to forecast locations', () => {
        const json = JSON.stringify({ type: 'FeatureCollection', features: [{ type: 'Feature', id: 'north', properties: { name: 'Northern region' }, geometry }, { type: 'Feature', id: 'south', geometry }] });
        expect(datasetGeometry(json, ['north']).features).toEqual([{ type: 'Feature', id: 'north', properties: { name: 'Northern region' }, geometry }]);
    });
    it('supports uploaded NAME_1 identifiers and rejects missing boundaries', () => {
        const json = JSON.stringify({ type: 'FeatureCollection', features: [{ properties: { NAME_1: 'North' }, geometry }] });
        expect(datasetGeometry(json, ['North']).features[0].id).toBe('North');
        expect(() => datasetGeometry(json, ['Unknown'])).toThrow('No dataset boundaries');
        expect(() => datasetGeometry(null, ['North'])).toThrow('does not contain');
    });
});
