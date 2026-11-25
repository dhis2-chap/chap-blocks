import { describe, expect, it } from 'vitest';
import {
    columnsFor,
    emptyDatasetDraft,
    getDraftPeriods,
    getModelFit,
    hasErrors,
    resolveTargetColumn,
    toColumnName,
    toDataSources,
    validateDatasetDraft,
    type DatasetDraft,
    type DatasetModel,
    type DatasetOptions,
} from './datasetDraft';

const options: DatasetOptions = {
    variables: [
        { id: 'cases', name: 'Malaria cases', column: 'disease_cases', source: 'DHIS2' },
        { id: 'rain', name: 'Total precipitation', column: 'rainfall', source: 'ERA5', periodTypes: ['MONTH'] },
        { id: 'rain-weekly', name: 'Weekly precipitation', column: 'rainfall', periodTypes: ['WEEK'] },
    ],
    periodTypes: [
        { id: 'MONTH', name: 'Monthly', periods: ['202401', '202402', '202403'].map(id => ({ id, name: id })) },
        { id: 'WEEK', name: 'Weekly', periods: ['2024W1', '2024W2'].map(id => ({ id, name: id })) },
    ],
};

const validDraft: DatasetDraft = {
    name: 'Malaria 2024',
    periodType: 'MONTH',
    startPeriod: '202401',
    endPeriod: '202403',
    locationIds: ['district-a'],
    columns: [{ name: 'disease_cases', variableId: 'cases' }, { name: 'rainfall', variableId: 'rain' }],
    targetColumn: '',
};

const model = (id: string, columns: string[], periodTypes?: string[]): DatasetModel => ({ id, name: id, columns, periodTypes });

describe('validateDatasetDraft', () => {
    it('accepts a complete draft', () => {
        expect(hasErrors(validateDatasetDraft(validDraft, options))).toBe(false);
    });

    it('reports every missing choice on an empty draft', () => {
        const errors = validateDatasetDraft(emptyDatasetDraft(), options);
        expect(Object.keys(errors).filter(key => key !== 'columnErrors' && errors[key as keyof typeof errors]))
            .toEqual(['name', 'periodType', 'startPeriod', 'endPeriod', 'locationIds', 'columns']);
        expect(hasErrors(errors)).toBe(true);
    });

    it('rejects an end period before the start period', () => {
        const errors = validateDatasetDraft({ ...validDraft, startPeriod: '202403', endPeriod: '202401' }, options);
        expect(errors.endPeriod).toMatch(/before the start/);
        expect(errors.startPeriod).toBeUndefined();
    });

    it('rejects periods that belong to another period type', () => {
        const errors = validateDatasetDraft({ ...validDraft, periodType: 'WEEK' }, options);
        expect(errors.startPeriod).toBeDefined();
        expect(errors.endPeriod).toBeDefined();
    });

    it('flags unnamed, duplicate and unsourced columns per row, leaving the first of a duplicate valid', () => {
        const errors = validateDatasetDraft({
            ...validDraft,
            columns: [
                { name: 'disease_cases', variableId: 'cases' },
                { name: ' disease_cases ', variableId: 'cases' },
                { name: '', variableId: '' },
            ],
        }, options);
        expect(errors.columnErrors[0]).toEqual({});
        expect(errors.columnErrors[1].name).toMatch(/Another column/);
        expect(errors.columnErrors[2].name).toBeDefined();
        expect(errors.columnErrors[2].variableId).toBeDefined();
    });

    it('flags a variable without values for the chosen period type', () => {
        const errors = validateDatasetDraft({ ...validDraft, periodType: 'WEEK', startPeriod: '2024W1', endPeriod: '2024W2' }, options);
        expect(errors.columnErrors[1].variableId).toBe('Total precipitation has no weekly data');
        expect(errors.columnErrors[0]).toEqual({});
    });

    it('needs a target column when no column is called disease_cases', () => {
        const draft = { ...validDraft, columns: [{ name: 'cases', variableId: 'cases' }] };
        expect(validateDatasetDraft(draft, options).targetColumn).toBeDefined();
        expect(validateDatasetDraft({ ...draft, targetColumn: 'cases' }, options).targetColumn).toBeUndefined();
    });
});

describe('resolveTargetColumn', () => {
    it('keeps a chosen target while it names a column, else falls back to disease_cases', () => {
        expect(resolveTargetColumn({ ...validDraft, targetColumn: 'rainfall' })).toBe('rainfall');
        expect(resolveTargetColumn({ ...validDraft, targetColumn: 'removed' })).toBe('disease_cases');
        expect(resolveTargetColumn({ ...validDraft, columns: [{ name: 'rainfall', variableId: 'rain' }] })).toBe('');
    });
});

describe('getDraftPeriods', () => {
    it('lists the periods in the range, inclusive', () => {
        expect(getDraftPeriods({ ...validDraft, startPeriod: '202402' }, options.periodTypes).map(period => period.id))
            .toEqual(['202402', '202403']);
    });

    it('is empty for a reversed or incomplete range', () => {
        expect(getDraftPeriods({ ...validDraft, startPeriod: '202403', endPeriod: '202401' }, options.periodTypes)).toEqual([]);
        expect(getDraftPeriods({ ...validDraft, endPeriod: '' }, options.periodTypes)).toEqual([]);
    });
});

describe('getModelFit', () => {
    it('sorts models into supported, missing columns (fewest first) and wrong period type', () => {
        const fit = getModelFit(['disease_cases', 'rainfall'], 'MONTH', [
            model('needs-two', ['disease_cases', 'temperature', 'population']),
            model('runs', ['disease_cases', 'rainfall']),
            model('needs-one', ['disease_cases', 'temperature']),
            model('weekly', ['disease_cases'], ['week']),
        ]);
        expect(fit.supported.map(m => m.id)).toEqual(['runs']);
        expect(fit.missingColumns.map(({ model: m, missing }) => [m.id, missing])).toEqual([
            ['needs-one', ['temperature']],
            ['needs-two', ['temperature', 'population']],
        ]);
        expect(fit.wrongPeriodType.map(m => m.id)).toEqual(['weekly']);
    });

    it('does not rule out models on period type before one is chosen', () => {
        expect(getModelFit([], '', [model('weekly', [], ['WEEK'])]).supported).toHaveLength(1);
    });
});

describe('columnsFor', () => {
    it('picks a variable that suggests the name and has values for the period type', () => {
        expect(columnsFor(['rainfall', 'population'], options.variables, 'WEEK')).toEqual([
            { name: 'rainfall', variableId: 'rain-weekly' },
            { name: 'population', variableId: '' },
        ]);
    });
});

describe('helpers', () => {
    it('turns a variable name into a column name', () => {
        expect(toColumnName('  Mean 2m Temperature (°C) ')).toBe('mean_2m_temperature_c');
    });

    it('maps columns to Chap Core data sources', () => {
        expect(toDataSources(validDraft)).toEqual([
            { covariate: 'disease_cases', dataElementId: 'cases' },
            { covariate: 'rainfall', dataElementId: 'rain' },
        ]);
    });
});
