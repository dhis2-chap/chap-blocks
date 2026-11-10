import { expect, it } from 'vitest';
import { projectBoundaries } from './geometry';
import { sortPeriods } from './signals';

it('sorts weekly and monthly periods chronologically', () => {
    expect(sortPeriods(['2025W10', '2025W2', '2025W1', '2024W52'])).toEqual(['2024W52', '2025W1', '2025W2', '2025W10']);
    expect(sortPeriods(['202503', '202412', '202501'])).toEqual(['202412', '202501', '202503']);
});

it('projects boundaries with more vertices than the call stack allows arguments', () => {
    const ring = Array.from({ length: 300_000 }, (_, i) => [i / 300_000, (i % 2) / 2] as [number, number]);
    const { height, paths } = projectBoundaries([{ id: 'a', name: 'A', polygons: [[ring]] }], 100);
    expect(height).toBeGreaterThan(0);
    expect(paths.get('a')).toMatch(/^M0\.0,/);
});
