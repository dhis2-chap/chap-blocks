import { describe, expect, it } from 'vitest';
import { getLeafLocationIds, groupLocationsByParent, leafIdsUnder } from './locationHierarchy';

const TREE = [
    { id: 'country', name: 'Country' },
    { id: 'north', name: 'North', parentId: 'country' },
    { id: 'south', name: 'South', parentId: 'country' },
    { id: 'a', name: 'A', parentId: 'north' },
    { id: 'b', name: 'B', parentId: 'north' },
    { id: 'c', name: 'C', parentId: 'south' },
];

describe('location hierarchy', () => {
    it('treats a flat list as leaves', () => {
        expect(getLeafLocationIds([{ id: 'x', name: 'X' }, { id: 'y', name: 'Y' }])).toEqual(['x', 'y']);
    });

    it('returns only the locations without children, in tree order', () => {
        expect(getLeafLocationIds(TREE)).toEqual(['a', 'b', 'c']);
    });

    it('collects the leaves under a group', () => {
        const children = groupLocationsByParent(TREE);
        expect(leafIdsUnder('north', children)).toEqual(['a', 'b']);
        expect(leafIdsUnder('a', children)).toEqual(['a']);
    });

    it('makes a location a root when its parent is not listed', () => {
        expect(groupLocationsByParent([{ id: 'a', name: 'A', parentId: 'missing' }]).get('')?.map(l => l.id)).toEqual(['a']);
    });

    it('leaves out locations in a parent cycle instead of looping', () => {
        expect(getLeafLocationIds([
            { id: 'a', name: 'A', parentId: 'b' },
            { id: 'b', name: 'B', parentId: 'a' },
            { id: 'c', name: 'C' },
        ])).toEqual(['c']);
    });
});
