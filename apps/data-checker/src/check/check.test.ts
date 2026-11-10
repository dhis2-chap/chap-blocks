import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkDataset } from './checkDataset';
import { describeImportError } from './importError';
import { parseCsv, parseNumber } from './csv';
import { parseBoundaries } from './geojson';
import { createProjection, getBounds, toSvgPath } from './mapGeometry';
import { detectPeriod, formatPeriod, getPeriodRange } from './periods';

const example = (name: string) => readFileSync(new URL(`../../public/examples/${name}`, import.meta.url), 'utf8');

const square = (name: string, x = 0) => ({
    type: 'Feature',
    properties: { NAME_1: name },
    geometry: { type: 'Polygon', coordinates: [[[x, 0], [x + 1, 0], [x + 1, 1], [x, 1], [x, 0]]] },
});
const geojson = (...names: string[]) => JSON.stringify({ type: 'FeatureCollection', features: names.map((name, index) => square(name, index)) });
const HEADER = 'time_period,location,disease_cases,population,rainfall,mean_temperature';
const ids = (report: ReturnType<typeof checkDataset>) => report.issues.map(issue => issue.id);

describe('parseCsv', () => {
    it('reads quoted values, escaped quotes, embedded newlines, CRLF and a BOM', () => {
        const parsed = parseCsv('﻿a,b\r\n"x, y","say ""hi"""\r\n"multi\nline",2\r\n');
        expect(parsed.header).toEqual(['a', 'b']);
        expect(parsed.rows.map(row => row.cells)).toEqual([['x, y', 'say "hi"'], ['multi\nline', '2']]);
        expect(parsed.rows.map(row => row.line)).toEqual([2, 3]);
        expect(parsed.errors).toEqual([]);
    });

    it('reports rows with the wrong number of values and keeps line numbers', () => {
        const parsed = parseCsv('a,b\n1,2\n\n3\n4,5,6\n7,8');
        expect(parsed.rows.map(row => row.cells)).toEqual([['1', '2'], ['7', '8']]);
        expect(parsed.errors).toEqual([
            { line: 4, message: 'Expected 2 values but found 1.' },
            { line: 5, message: 'Expected 2 values but found 3.' },
        ]);
    });

    it('reports an unclosed quote', () => {
        expect(parseCsv('a,b\n"1,2\n3,4').errors[0]).toEqual({ line: 2, message: 'A quoted value is never closed.' });
    });

    it('detects semicolon and tab delimiters', () => {
        expect(parseCsv('a;b\n1;2').delimiter).toBe(';');
        expect(parseCsv('a\tb\n1\t2').rows[0].cells).toEqual(['1', '2']);
    });
});

describe('parseNumber', () => {
    it('separates numbers, missing markers and text', () => {
        expect(parseNumber('12.5')).toBe(12.5);
        expect(parseNumber('-3e2')).toBe(-300);
        expect(parseNumber('0')).toBe(0);
        expect(parseNumber('')).toBeNull();
        expect(parseNumber('NA')).toBeNull();
        expect(parseNumber('nan')).toBeNull();
        expect(parseNumber('12 cases')).toBeUndefined();
        expect(parseNumber('1,5')).toBeUndefined();
    });
});

describe('periods', () => {
    it('detects Chap period formats', () => {
        expect(detectPeriod('2024-01')).toEqual({ type: 'month', id: '202401' });
        expect(detectPeriod('202412')).toEqual({ type: 'month', id: '202412' });
        expect(detectPeriod('2024-W05')).toEqual({ type: 'week', id: '2024W5' });
        expect(detectPeriod('2020W53')).toEqual({ type: 'week', id: '2020W53' });
        expect(detectPeriod('2024-01-31')).toEqual({ type: 'day', id: '20240131' });
        expect(detectPeriod('2024')).toEqual({ type: 'year', id: '2024' });
    });

    it('rejects impossible periods', () => {
        expect(detectPeriod('2024-13')).toBeNull();
        expect(detectPeriod('2021-W53')).toBeNull();
        expect(detectPeriod('2023-02-29')).toBeNull();
        expect(detectPeriod('Jan 2024')).toBeNull();
    });

    it('builds ranges across year boundaries and formats labels', () => {
        expect(getPeriodRange('202311', '202402')).toEqual(['202311', '202312', '202401', '202402']);
        expect(getPeriodRange('2020W52', '2021W2')).toEqual(['2020W52', '2020W53', '2021W1', '2021W2']);
        expect(formatPeriod('2021W2')).toBe('2021-W02');
        expect(formatPeriod('202401')).toBe('2024-01');
    });
});

describe('parseBoundaries', () => {
    it('requires a FeatureCollection', () => {
        expect(parseBoundaries('{').error).toMatch(/not valid JSON/);
        expect(parseBoundaries('{"type":"Feature"}').error).toMatch(/FeatureCollection/);
        expect(parseBoundaries('{"type":"FeatureCollection","features":[]}').error).toMatch(/no features/);
    });

    it('collects NAME_1 names, unnamed features and missing geometry', () => {
        const parsed = parseBoundaries(JSON.stringify({
            type: 'FeatureCollection',
            features: [square('A'), { type: 'Feature', properties: { name: 'B' }, geometry: null }, { type: 'Feature', properties: { NAME_1: 'C' }, geometry: null }],
        }));
        expect(parsed.boundaries.map(boundary => boundary.name)).toEqual(['A', 'C']);
        expect(parsed.unnamed).toEqual([1]);
        expect(parsed.withoutGeometry).toEqual(['C']);
    });
});

describe('checkDataset', () => {
    it('accepts the example files without issues', () => {
        const report = checkDataset(example('observations.csv'), example('boundaries.geojson'));
        expect(report.issues).toEqual([]);
        expect(report.periodType).toBe('month');
        expect(report.periods).toHaveLength(60);
        expect(report.periods[0]).toBe('2020-01');
        expect(report.locations).toEqual(['Demo North', 'Demo South']);
        expect(report.variables).toEqual(['disease_cases', 'population', 'rainfall', 'mean_temperature']);
        expect(report.variableCompleteness.every(item => item.present === 120 && item.expected === 120)).toBe(true);
        expect(report.observations).toHaveLength(480);
        expect(report.boundaries?.every(boundary => boundary.status === 'matched')).toBe(true);
    });

    it('reports missing required columns with case-sensitivity hints', () => {
        const report = checkDataset('Time_Period,location,cases\n2024-01,A,1', geojson('A'));
        const issue = report.issues.find(item => item.id === 'missing-required-columns');
        expect(issue?.severity).toBe('error');
        expect(issue?.examples).toEqual(['time_period (found “Time_Period”; names are case-sensitive)', 'disease_cases']);
        expect(ids(report)).toContain('missing-covariates');
    });

    it('reports duplicates, unreadable periods, gaps and partial locations', () => {
        const csv = [
            'time_period,location,disease_cases',
            '2024-01,A,1', '2024-01,A,2', '2024-01,B,3',
            '2024-04,A,4', '2024-04,B,5', '2024-05,A,6',
            'May 2024,B,7',
        ].join('\n');
        const report = checkDataset(csv, geojson('A', 'B'));
        expect(report.issues.find(issue => issue.id === 'duplicate-rows')?.examples).toEqual(['2024-01 · A (lines 2, 3)']);
        expect(report.issues.find(issue => issue.id === 'invalid-periods')?.examples).toEqual(['Line 8: “May 2024”']);
        expect(report.missingPeriods).toEqual(['2024-02', '2024-03']);
        expect(report.issues.find(issue => issue.id === 'partial-locations')?.examples).toEqual(['B: 2 of 3 periods']);
        // The first duplicate wins.
        expect(report.observations.find(o => o.orgUnit === 'A' && o.period === '2024-01')?.value).toBe(1);
        expect(report.variableCompleteness[0]).toMatchObject({ variable: 'disease_cases', present: 5, expected: 10 });
        expect(report.locationCompleteness).toEqual([
            { location: 'A', present: 3, expected: 5 },
            { location: 'B', present: 2, expected: 5 },
        ]);
    });

    it('reports mixed period types', () => {
        const report = checkDataset('time_period,location,disease_cases\n2024-01,A,1\n2024-02,A,1\n2024-W05,A,1', geojson('A'));
        expect(report.periodType).toBe('month');
        expect(report.issues.find(issue => issue.id === 'mixed-period-types')?.examples).toEqual(['month: 2 rows', 'week: 1 row']);
    });

    it('reports non-numeric and negative values, and treats text-only columns separately', () => {
        const csv = 'time_period,location,disease_cases,population,region\n2024-01,A,-1,x,North\n2024-02,A,NA,10,North';
        const report = checkDataset(csv, geojson('A'));
        expect(report.variables).toEqual(['disease_cases', 'population']);
        expect(ids(report)).toEqual(expect.arrayContaining(['non-numeric-population', 'negative-disease_cases', 'text-columns', 'missing-values']));
        expect(report.variableCompleteness).toEqual([
            { variable: 'disease_cases', present: 1, expected: 2, zeros: 0, nonNumeric: 0 },
            { variable: 'population', present: 1, expected: 2, zeros: 0, nonNumeric: 1 },
        ]);
    });

    it('matches locations to NAME_1 both ways, suggesting near misses', () => {
        const report = checkDataset('time_period,location,disease_cases\n2024-01,a,1\n2024-01,B,1', geojson('A', 'B', 'C'));
        expect(report.locationsWithoutBoundary).toEqual(['a']);
        expect(report.boundariesWithoutData).toEqual(['A', 'C']);
        expect(report.issues.find(issue => issue.id === 'locations-without-boundary')?.examples).toEqual(['a (a boundary is named “A”)']);
        expect(report.boundaries?.map(boundary => boundary.status)).toEqual(['boundary-only', 'matched', 'boundary-only']);
    });

    it('reports a missing or broken boundaries file and a non-comma CSV', () => {
        expect(ids(checkDataset('time_period,location,disease_cases\n2024-01,A,1'))).toContain('no-geojson');
        expect(ids(checkDataset('time_period,location,disease_cases\n2024-01,A,1', 'nope'))).toContain('geojson-invalid');
        expect(ids(checkDataset('time_period;location;disease_cases\n2024-01;A;1', geojson('A')))).toContain('delimiter');
        expect(ids(checkDataset(''))).toEqual(['empty-csv']);
    });

    it('lists errors before warnings', () => {
        const report = checkDataset('time_period,location\n2024-01,A');
        const severities = report.issues.map(issue => issue.severity);
        expect(severities).toEqual([...severities].sort());
    });
});

describe('mapGeometry', () => {
    it('fits boundaries into the requested width', () => {
        const parsed = parseBoundaries(geojson('A', 'B'));
        const bounds = getBounds(parsed.boundaries.map(boundary => boundary.geometry));
        expect(bounds).toEqual({ minX: 0, minY: 0, maxX: 2, maxY: 1 });
        const projection = createProjection(bounds!, 200, 0);
        expect(projection.width).toBe(200);
        expect(projection.height).toBe(100);
        expect(toSvgPath(parsed.boundaries[0].geometry!, projection)).toBe('M0,100L100,100L100,0L0,0L0,100Z');
    });

    it('returns null bounds without geometry', () => {
        expect(getBounds([null])).toBeNull();
        expect(getBounds([{ type: 'Polygon', coordinates: [] }])).toBeNull();
    });

    it('skips malformed rings instead of throwing', () => {
        const projection = createProjection({ minX: 0, minY: 0, maxX: 1, maxY: 1 }, 100, 0);
        const broken = { type: 'MultiPolygon', coordinates: [null, [null, [[5]]]] } as never;
        expect(toSvgPath(broken, projection)).toBe('');
    });
});

describe('describeImportError', () => {
    it('reads Chap error details', () => {
        expect(describeImportError({ body: { detail: 'Missing polygons for Demo East' } })).toBe('Missing polygons for Demo East');
        expect(describeImportError({ body: { detail: [{ msg: 'Field required' }, { msg: 'Bad value' }] } })).toBe('Field required; Bad value');
        expect(describeImportError(new Error('Failed to fetch'))).toBe('Failed to fetch');
        expect(describeImportError(null)).toBe('The import failed.');
    });
});
