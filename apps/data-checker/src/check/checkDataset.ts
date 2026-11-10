import type { ObservationBase } from '@chap-blocks/api';
import { parseCsv, parseNumber } from './csv';
import { parseBoundaries, type Boundary } from './geojson';
import { detectPeriod, formatPeriod, getPeriodRange, type ChapPeriodType } from './periods';

export const PERIOD_COLUMN = 'time_period';
export const LOCATION_COLUMN = 'location';
export const TARGET_COLUMN = 'disease_cases';
export const REQUIRED_COLUMNS = [PERIOD_COLUMN, LOCATION_COLUMN, TARGET_COLUMN];
/** Covariates most Chap models read. Missing ones are warnings: some models do without them. */
export const COMMON_COVARIATES = ['population', 'rainfall', 'mean_temperature'];
/** Columns where a negative value cannot be right. */
const NON_NEGATIVE_COLUMNS = new Set([TARGET_COLUMN, 'population', 'rainfall']);

const MAX_EXAMPLES = 5;

export type Severity = 'error' | 'warning';

export type Issue = {
    id: string;
    severity: Severity;
    title: string;
    detail?: string;
    examples?: string[];
};

export type VariableCompleteness = {
    variable: string;
    present: number;
    expected: number;
    zeros: number;
    nonNumeric: number;
};

export type BoundaryStatus = 'matched' | 'boundary-only';

export type DatasetReport = {
    issues: Issue[];
    rowCount: number;
    columns: string[];
    periodType: ChapPeriodType | null;
    /** Every period from the first to the last observed one, as labels (2024-01, 2024-W05). */
    periods: string[];
    /** Periods in the range with no rows at all. */
    missingPeriods: string[];
    /** CSV locations in order of first appearance. */
    locations: string[];
    /** Numeric columns other than time_period and location, target first. */
    variables: string[];
    variableCompleteness: VariableCompleteness[];
    /** Values present per location, over every period and variable. */
    locationCompleteness: { location: string; present: number; expected: number }[];
    /** One observation per (period, location, variable) cell, in the shape Chap's completeness view reads. */
    observations: ObservationBase[];
    boundaries: (Boundary & { status: BoundaryStatus })[] | null;
    /** CSV locations without a boundary. */
    locationsWithoutBoundary: string[];
    /** Boundaries without CSV rows. */
    boundariesWithoutData: string[];
};

const examplesOf = (values: string[]) => (
    values.length > MAX_EXAMPLES
        ? [...values.slice(0, MAX_EXAMPLES), `… and ${values.length - MAX_EXAMPLES} more`]
        : values
);

const plural = (count: number, singular: string, pluralForm = `${singular}s`) => `${count} ${count === 1 ? singular : pluralForm}`;

const emptyReport = (issues: Issue[]): DatasetReport => ({
    issues,
    rowCount: 0,
    columns: [],
    periodType: null,
    periods: [],
    missingPeriods: [],
    locations: [],
    variables: [],
    variableCompleteness: [],
    locationCompleteness: [],
    observations: [],
    boundaries: null,
    locationsWithoutBoundary: [],
    boundariesWithoutData: [],
});

const checkColumns = (header: string[], issues: Issue[]) => {
    const seen = new Set<string>();
    const duplicates = header.filter(column => (seen.has(column) ? true : (seen.add(column), false)));
    if (duplicates.length) {
        issues.push({ id: 'duplicate-columns', severity: 'error', title: 'Duplicate column names', detail: 'Each column name must be unique.', examples: examplesOf([...new Set(duplicates)]) });
    }
    if (header.some(column => !column)) {
        issues.push({ id: 'empty-column-name', severity: 'error', title: 'A column has no name', detail: 'Give every column in the header row a name.' });
    }
    const hint = (column: string) => {
        const nearMiss = header.find(name => name.trim().toLowerCase() === column);
        return nearMiss ? `${column} (found “${nearMiss}”; names are case-sensitive)` : column;
    };
    const missingRequired = REQUIRED_COLUMNS.filter(column => !header.includes(column));
    if (missingRequired.length) {
        issues.push({
            id: 'missing-required-columns',
            severity: 'error',
            title: `Missing required ${missingRequired.length === 1 ? 'column' : 'columns'}`,
            detail: 'Chap reads time_period and location for every row, and disease_cases as the default target.',
            examples: missingRequired.map(hint),
        });
    }
    const missingCovariates = COMMON_COVARIATES.filter(column => !header.includes(column));
    if (missingCovariates.length) {
        issues.push({
            id: 'missing-covariates',
            severity: 'warning',
            title: `No ${missingCovariates.join(', ')} ${missingCovariates.length === 1 ? 'column' : 'columns'}`,
            detail: 'Many models use these covariates. See which models can still use this dataset below.',
            examples: missingCovariates.map(hint).filter(text => text.includes('found')),
        });
    }
};

/**
 * Checks a Chap-format CSV, and optionally its GeoJSON boundaries, before import.
 * Runs entirely in memory: nothing is sent anywhere.
 */
export const checkDataset = (csvText: string, geojsonText?: string | null): DatasetReport => {
    const issues: Issue[] = [];
    const csv = parseCsv(csvText);

    if (!csv.header.length) {
        return emptyReport([{ id: 'empty-csv', severity: 'error', title: 'The CSV file is empty' }]);
    }
    if (csv.delimiter !== ',') {
        issues.push({
            id: 'delimiter',
            severity: 'error',
            title: `Values are separated by ${csv.delimiter === '\t' ? 'tabs' : `“${csv.delimiter}”`}`,
            detail: 'Chap reads comma-separated files. Export the file again as CSV with commas.',
        });
    }
    if (csv.errors.length) {
        issues.push({
            id: 'parse-errors',
            severity: 'error',
            title: `${plural(csv.errors.length, 'row')} could not be read`,
            detail: 'These rows are left out of the other checks.',
            examples: examplesOf(csv.errors.map(error => `Line ${error.line}: ${error.message}`)),
        });
    }
    checkColumns(csv.header, issues);
    if (!csv.rows.length) {
        issues.push({ id: 'no-rows', severity: 'error', title: 'The CSV file has a header but no data rows' });
    }

    const column = (name: string) => csv.header.indexOf(name);
    const periodIndex = column(PERIOD_COLUMN);
    const locationIndex = column(LOCATION_COLUMN);
    const variableIndexes = csv.header
        .map((name, index) => ({ name, index }))
        .filter(({ name, index }) => name && index !== periodIndex && index !== locationIndex && csv.header.indexOf(name) === index);

    // Periods: one type, every value readable.
    const invalidPeriods: string[] = [];
    const periodTypeCounts = new Map<ChapPeriodType, number>();
    const rowPeriods = csv.rows.map((row) => {
        if (periodIndex < 0) return null;
        const period = detectPeriod(row.cells[periodIndex]);
        if (!period) invalidPeriods.push(`Line ${row.line}: “${row.cells[periodIndex]}”`);
        else periodTypeCounts.set(period.type, (periodTypeCounts.get(period.type) ?? 0) + 1);
        return period;
    });
    if (invalidPeriods.length) {
        issues.push({
            id: 'invalid-periods',
            severity: 'error',
            title: `${plural(invalidPeriods.length, 'row')} with an unreadable time_period`,
            detail: 'Use months like 2024-01, ISO weeks like 2024-W05, days like 2024-01-31 or years like 2024.',
            examples: examplesOf(invalidPeriods),
        });
    }
    const typesByCount = [...periodTypeCounts.entries()].sort((a, b) => b[1] - a[1]);
    const periodType = typesByCount[0]?.[0] ?? null;
    if (typesByCount.length > 1) {
        issues.push({
            id: 'mixed-period-types',
            severity: 'error',
            title: 'Rows use different period types',
            detail: 'A dataset must use one period type. Rows with another type are left out of the other checks.',
            examples: typesByCount.map(([type, count]) => `${type}: ${plural(count, 'row')}`),
        });
    }

    // Locations.
    const blankLocations: string[] = [];
    const locations: string[] = [];
    const locationSet = new Set<string>();
    csv.rows.forEach((row) => {
        if (locationIndex < 0) return;
        const location = row.cells[locationIndex];
        if (!location) blankLocations.push(`Line ${row.line}`);
        else if (!locationSet.has(location)) {
            locationSet.add(location);
            locations.push(location);
        }
    });
    if (blankLocations.length) {
        issues.push({ id: 'blank-locations', severity: 'error', title: `${plural(blankLocations.length, 'row')} without a location`, examples: examplesOf(blankLocations) });
    }

    // Rows usable for the cell checks: readable period of the main type and a location.
    const usable = csv.rows.flatMap((row, index) => {
        const period = rowPeriods[index];
        const location = locationIndex < 0 ? '' : row.cells[locationIndex];
        return period && period.type === periodType && location ? [{ row, period, location }] : [];
    });

    // Duplicates: one row per (period, location).
    const linesByKey = new Map<string, number[]>();
    usable.forEach(({ row, period, location }) => {
        const key = JSON.stringify([period.id, location]);
        linesByKey.set(key, [...(linesByKey.get(key) ?? []), row.line]);
    });
    const duplicates = [...linesByKey.entries()].filter(([, lines]) => lines.length > 1);
    if (duplicates.length) {
        issues.push({
            id: 'duplicate-rows',
            severity: 'error',
            title: `${plural(duplicates.length, 'period and location pair')} appear more than once`,
            detail: 'Chap expects one row per location and period. The first row is used below.',
            examples: examplesOf(duplicates.map(([key, lines]) => {
                const [period, location] = JSON.parse(key) as [string, string];
                return `${formatPeriod(period)} · ${location} (lines ${lines.join(', ')})`;
            })),
        });
    }

    // Period range and gaps.
    const observedIds = [...new Set(usable.map(({ period }) => period.id))];
    const sortedIds = periodType === 'week'
        ? observedIds.sort((a, b) => {
            const [ya, wa] = a.split('W').map(Number);
            const [yb, wb] = b.split('W').map(Number);
            return ya - yb || wa - wb;
        })
        : observedIds.sort();
    const rangeIds = sortedIds.length ? getPeriodRange(sortedIds[0], sortedIds[sortedIds.length - 1]) : [];
    const periodIds = rangeIds.length ? rangeIds : sortedIds;
    const observedSet = new Set(observedIds);
    const missingPeriods = periodIds.filter(id => !observedSet.has(id)).map(formatPeriod);
    if (missingPeriods.length) {
        issues.push({
            id: 'period-gaps',
            severity: 'warning',
            title: `${plural(missingPeriods.length, 'period')} missing from the series`,
            detail: `No location has rows for these periods between ${formatPeriod(periodIds[0])} and ${formatPeriod(periodIds[periodIds.length - 1])}.`,
            examples: examplesOf(missingPeriods),
        });
    }

    // Locations that do not cover every period.
    const periodsByLocation = new Map<string, Set<string>>();
    usable.forEach(({ period, location }) => {
        periodsByLocation.set(location, (periodsByLocation.get(location) ?? new Set()).add(period.id));
    });
    // Measured against the periods that have rows anywhere: whole missing periods are reported above.
    const partialLocations = locations
        .filter(location => (periodsByLocation.get(location)?.size ?? 0) < observedIds.length)
        .map(location => `${location}: ${periodsByLocation.get(location)?.size ?? 0} of ${observedIds.length} periods`);
    if (partialLocations.length && observedIds.length) {
        issues.push({
            id: 'partial-locations',
            severity: 'warning',
            title: `${plural(partialLocations.length, 'location')} without rows for every period`,
            detail: 'Models need a value for each location and period. See completeness below.',
            examples: examplesOf(partialLocations),
        });
    }

    // Values: numeric, non-negative where it matters.
    const observations: ObservationBase[] = [];
    const seenKeys = new Set<string>();
    const stats = new Map(variableIndexes.map(({ name }) => [name, { present: 0, zeros: 0, nonNumeric: [] as string[], negative: [] as string[] }]));
    usable.forEach(({ row, period, location }) => {
        const key = JSON.stringify([period.id, location]);
        if (seenKeys.has(key)) return;
        seenKeys.add(key);
        variableIndexes.forEach(({ name, index }) => {
            const stat = stats.get(name)!;
            const value = parseNumber(row.cells[index]);
            if (value === undefined) stat.nonNumeric.push(`Line ${row.line}: “${row.cells[index]}”`);
            if (typeof value === 'number') {
                stat.present++;
                if (value === 0) stat.zeros++;
                if (value < 0 && NON_NEGATIVE_COLUMNS.has(name)) stat.negative.push(`Line ${row.line}: ${value}`);
                observations.push({ period: formatPeriod(period.id), orgUnit: location, featureName: name, value });
            }
        });
    });
    // Columns with no numbers at all (such as a name column) are not variables.
    const textColumns = variableIndexes.filter(({ name }) => stats.get(name)!.present === 0 && stats.get(name)!.nonNumeric.length > 0).map(({ name }) => name);
    const variables = variableIndexes
        .map(({ name }) => name)
        .filter(name => !textColumns.includes(name))
        .sort((a, b) => Number(b === TARGET_COLUMN) - Number(a === TARGET_COLUMN));
    if (textColumns.length) {
        issues.push({
            id: 'text-columns',
            severity: textColumns.includes(TARGET_COLUMN) ? 'error' : 'warning',
            title: `${plural(textColumns.length, 'column')} without any numbers`,
            detail: 'Chap reads every column other than time_period and location as a numeric variable.',
            examples: examplesOf(textColumns),
        });
    }
    variables.forEach((name) => {
        const stat = stats.get(name)!;
        if (stat.nonNumeric.length) {
            issues.push({
                id: `non-numeric-${name}`,
                severity: 'warning',
                title: `${plural(stat.nonNumeric.length, 'value')} in ${name} ${stat.nonNumeric.length === 1 ? 'is' : 'are'} not a number`,
                detail: 'They are counted as missing. Leave a cell empty, or write NA, for a missing value.',
                examples: examplesOf(stat.nonNumeric),
            });
        }
        if (stat.negative.length) {
            issues.push({ id: `negative-${name}`, severity: 'warning', title: `${plural(stat.negative.length, 'negative value')} in ${name}`, examples: examplesOf(stat.negative) });
        }
    });

    const expected = periodIds.length * locations.length;
    const variableCompleteness = variables.map((variable) => {
        const stat = stats.get(variable)!;
        return { variable, present: stat.present, expected, zeros: stat.zeros, nonNumeric: stat.nonNumeric.length };
    });
    const presentByLocation = new Map<string, number>();
    observations.forEach(({ orgUnit }) => presentByLocation.set(orgUnit, (presentByLocation.get(orgUnit) ?? 0) + 1));
    const locationCompleteness = locations.map(location => ({
        location,
        present: presentByLocation.get(location) ?? 0,
        expected: periodIds.length * variables.length,
    }));
    const incomplete = variableCompleteness.filter(item => item.expected && item.present < item.expected);
    if (incomplete.length) {
        issues.push({
            id: 'missing-values',
            severity: 'warning',
            title: `Missing values in ${plural(incomplete.length, 'variable')}`,
            examples: examplesOf(incomplete.map(item => `${item.variable}: ${item.expected - item.present} of ${item.expected} missing`)),
        });
    }

    // Boundaries, matched to locations by NAME_1.
    let boundaries: DatasetReport['boundaries'] = null;
    let locationsWithoutBoundary: string[] = [];
    let boundariesWithoutData: string[] = [];
    if (geojsonText == null) {
        issues.push({ id: 'no-geojson', severity: 'error', title: 'No boundaries file', detail: 'Chap imports a CSV together with GeoJSON boundaries for its locations.' });
    } else {
        const parsed = parseBoundaries(geojsonText);
        if (parsed.error) {
            issues.push({ id: 'geojson-invalid', severity: 'error', title: 'The boundaries file cannot be used', detail: parsed.error });
        } else {
            if (parsed.unnamed.length) {
                issues.push({
                    id: 'geojson-unnamed',
                    severity: 'error',
                    title: `${plural(parsed.unnamed.length, 'boundary', 'boundaries')} without a NAME_1 property`,
                    detail: 'Chap matches each feature’s NAME_1 property to the CSV location column.',
                    examples: examplesOf(parsed.unnamed.map(index => `Feature ${index + 1}`)),
                });
            }
            if (parsed.withoutGeometry.length) {
                issues.push({ id: 'geojson-geometry', severity: 'warning', title: `${plural(parsed.withoutGeometry.length, 'boundary', 'boundaries')} without a usable geometry`, examples: examplesOf(parsed.withoutGeometry) });
            }
            const names = parsed.boundaries.map(boundary => boundary.name);
            const duplicateNames = [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
            if (duplicateNames.length) {
                issues.push({ id: 'geojson-duplicates', severity: 'warning', title: `${plural(duplicateNames.length, 'NAME_1 value')} used by more than one boundary`, examples: examplesOf(duplicateNames) });
            }
            const nameSet = new Set(names);
            const looseNames = new Map(names.map(name => [name.trim().toLowerCase(), name]));
            const looseLocations = new Map(locations.map(name => [name.trim().toLowerCase(), name]));
            boundaries = parsed.boundaries.map(boundary => ({ ...boundary, status: locationSet.has(boundary.name) ? 'matched' : 'boundary-only' }));
            locationsWithoutBoundary = locations.filter(location => !nameSet.has(location));
            boundariesWithoutData = [...new Set(names.filter(name => !locationSet.has(name)))];
            if (locationsWithoutBoundary.length) {
                issues.push({
                    id: 'locations-without-boundary',
                    severity: 'error',
                    title: `${plural(locationsWithoutBoundary.length, 'location')} in the CSV without a boundary`,
                    detail: 'Add a GeoJSON feature whose NAME_1 is exactly the location name.',
                    examples: examplesOf(locationsWithoutBoundary.map((location) => {
                        const similar = looseNames.get(location.trim().toLowerCase());
                        return similar ? `${location} (a boundary is named “${similar}”)` : location;
                    })),
                });
            }
            if (boundariesWithoutData.length) {
                issues.push({
                    id: 'boundaries-without-data',
                    severity: 'warning',
                    title: `${plural(boundariesWithoutData.length, 'boundary', 'boundaries')} without CSV rows`,
                    detail: 'These areas have no data and are not used by models.',
                    examples: examplesOf(boundariesWithoutData.map((name) => {
                        const similar = looseLocations.get(name.trim().toLowerCase());
                        return similar ? `${name} (a location is named “${similar}”)` : name;
                    })),
                });
            }
        }
    }

    return {
        issues: issues.sort((a, b) => Number(a.severity === 'warning') - Number(b.severity === 'warning')),
        rowCount: csv.rows.length,
        columns: csv.header,
        periodType,
        periods: periodIds.map(formatPeriod),
        missingPeriods,
        locations,
        variables,
        variableCompleteness,
        locationCompleteness,
        observations,
        boundaries,
        locationsWithoutBoundary,
        boundariesWithoutData,
    };
};
