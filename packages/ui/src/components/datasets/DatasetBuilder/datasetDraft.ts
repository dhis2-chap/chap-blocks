import i18n from '@dhis2/d2-i18n';
import type { DataSource } from '@chap-blocks/api';
import {
    compareFixedPeriods,
    createFixedPeriodFromPeriodId,
    getPeriodsInRange,
    type Dhis2Calendar,
    type Dhis2FixedPeriod,
    type Dhis2FixedPeriodType,
} from '@chap-blocks/core';

/**
 * Something the host can supply values for: a DHIS2 data element, a climate dataset, an uploaded column.
 * The builder only chooses variables; fetching their values stays with the host.
 */
export type DatasetVariable = {
    id: string;
    name: string;
    /** Column name to suggest when the variable is chosen, e.g. `rainfall`. */
    column?: string;
    /** Where it comes from, shown next to the name, e.g. `DHIS2` or `ERA5`. */
    source?: string;
    /** Period types the variable has values for, e.g. `['MONTHLY']`. Leave out when it has values for every one. */
    periodTypes?: string[];
};

/** A period type the host can supply values for. Chap Core reads DHIS2 period ids, such as `202401` or `2024W1`. */
export type DatasetPeriodType = {
    id: Dhis2FixedPeriodType;
    name: string;
    /** The earliest and latest periods that can be chosen, for example where the host has data. */
    minPeriodId?: string;
    maxPeriodId?: string;
};

/** What a model needs from a dataset, so the builder can show which models will run on it. */
export type DatasetModel = {
    id: string;
    name: string;
    columns: string[];
    /** Period types the model accepts, e.g. `['MONTHLY']`. Leave out when it accepts any. */
    periodTypes?: string[];
};

export type DatasetColumn = { name: string; variableId: string };

export type DatasetDraft = {
    name: string;
    periodType: string;
    startPeriod: string;
    endPeriod: string;
    locationIds: string[];
    columns: DatasetColumn[];
    /** The column models predict. */
    targetColumn: string;
};

export type DatasetDraftErrors = {
    name?: string;
    periodType?: string;
    startPeriod?: string;
    endPeriod?: string;
    locationIds?: string;
    columns?: string;
    targetColumn?: string;
    columnErrors: { name?: string; variableId?: string }[];
};

export type DatasetOptions = {
    variables: DatasetVariable[];
    periodTypes: DatasetPeriodType[];
    /** The DHIS2 calendar periods are in. Defaults to `gregory`. */
    calendar?: Dhis2Calendar;
};

export const emptyDatasetDraft = (periodType = ''): DatasetDraft => ({
    name: '',
    periodType,
    startPeriod: '',
    endPeriod: '',
    locationIds: [],
    columns: [],
    targetColumn: '',
});

export const isAvailableFor = (variable: DatasetVariable, periodType: string) => (
    !variable.periodTypes || variable.periodTypes.includes(periodType)
);

/** The period, when the id is one of the period type's and within its bounds. */
const toPeriod = (id: string, type: DatasetPeriodType, calendar: Dhis2Calendar): Dhis2FixedPeriod | undefined => {
    let period: Dhis2FixedPeriod;
    try {
        period = createFixedPeriodFromPeriodId({ periodId: id, calendar });
    }
    catch {
        return undefined;
    }
    if (period.periodType !== type.id) return undefined;
    const outside = (bound: string | undefined, sign: number) => (
        !!bound && sign * compareFixedPeriods(period, createFixedPeriodFromPeriodId({ periodId: bound, calendar })) > 0
    );
    return outside(type.minPeriodId, -1) || outside(type.maxPeriodId, 1) ? undefined : period;
};

/** A column name a model can read: lower case words joined by underscores. */
export const toColumnName = (name: string) => name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const suggestColumnName = (variable: DatasetVariable) => variable.column ?? toColumnName(variable.name);

/** The chosen target while it names a column, otherwise `disease_cases` when there is one. */
export const resolveTargetColumn = (draft: DatasetDraft): string => {
    const names = draft.columns.map(column => column.name.trim());
    if (draft.targetColumn && names.includes(draft.targetColumn)) return draft.targetColumn;
    return names.includes('disease_cases') ? 'disease_cases' : '';
};

/** The periods from start to end, inclusive; empty when either is missing or invalid, or they are reversed. */
export const getDraftPeriods = (draft: Pick<DatasetDraft, 'startPeriod' | 'endPeriod'>, calendar: Dhis2Calendar = 'gregory'): Dhis2FixedPeriod[] => {
    if (!draft.startPeriod || !draft.endPeriod) return [];
    try {
        return getPeriodsInRange({ startPeriodId: draft.startPeriod, endPeriodId: draft.endPeriod, calendar });
    }
    catch {
        return [];
    }
};

export const validateDatasetDraft = (
    draft: DatasetDraft,
    { variables, periodTypes, calendar = 'gregory' }: DatasetOptions,
): DatasetDraftErrors => {
    const errors: DatasetDraftErrors = { columnErrors: [] };
    const periodType = periodTypes.find(type => type.id === draft.periodType);
    const start = periodType && toPeriod(draft.startPeriod, periodType, calendar);
    const end = periodType && toPeriod(draft.endPeriod, periodType, calendar);

    if (!draft.name.trim()) errors.name = i18n.t('Name the dataset');
    if (!periodType) errors.periodType = i18n.t('Choose a period type');
    if (!start) errors.startPeriod = i18n.t('Choose a start period');
    if (!end) errors.endPeriod = i18n.t('Choose an end period');
    else if (start && compareFixedPeriods(end, start) < 0) {
        errors.endPeriod = i18n.t('The end period must not be before the start period');
    }
    if (!draft.locationIds.length) errors.locationIds = i18n.t('Choose at least one location');
    if (!draft.columns.length) errors.columns = i18n.t('Add at least one column');

    const names = draft.columns.map(column => column.name.trim());
    errors.columnErrors = draft.columns.map((column, index) => {
        const columnErrors: DatasetDraftErrors['columnErrors'][number] = {};
        const name = names[index];
        const variable = variables.find(candidate => candidate.id === column.variableId);
        if (!name) columnErrors.name = i18n.t('Name the column');
        else if (names.indexOf(name) !== index) columnErrors.name = i18n.t('Another column has this name');
        // Chap matches columns to model covariates by exact name, and those are lower case words joined by underscores.
        else if (toColumnName(name) !== name) {
            columnErrors.name = i18n.t('Use lower case letters, numbers and underscores, such as {{example}}', {
                example: toColumnName(name) || 'rainfall',
                interpolation: { escapeValue: false },
            });
        }
        if (!variable) columnErrors.variableId = i18n.t('Choose the data for this column');
        else if (periodType && !isAvailableFor(variable, periodType.id)) {
            columnErrors.variableId = i18n.t('{{variable}} has no {{periodType}} data', {
                variable: variable.name,
                periodType: periodType.name.toLowerCase(),
                interpolation: { escapeValue: false },
            });
        }
        return columnErrors;
    });

    if (draft.columns.length && !resolveTargetColumn(draft)) errors.targetColumn = i18n.t('Choose the column to predict');
    return errors;
};

export const hasErrors = ({ columnErrors, ...errors }: DatasetDraftErrors) => (
    Object.values(errors).some(Boolean) || columnErrors.some(column => column.name || column.variableId)
);

export type DatasetModelFit = {
    supported: DatasetModel[];
    /** Models that accept the period type but miss columns, fewest missing first. */
    missingColumns: { model: DatasetModel; missing: string[] }[];
    /** Models that cannot run on this period type whatever the columns. */
    wrongPeriodType: DatasetModel[];
};

export const getModelFit = (columnNames: string[], periodType: string, models: DatasetModel[]): DatasetModelFit => {
    const fit: DatasetModelFit = { supported: [], missingColumns: [], wrongPeriodType: [] };
    for (const model of models) {
        if (periodType && model.periodTypes && !model.periodTypes.includes(periodType)) {
            fit.wrongPeriodType.push(model);
            continue;
        }
        const missing = model.columns.filter(column => !columnNames.includes(column));
        if (missing.length) fit.missingColumns.push({ model, missing });
        else fit.supported.push(model);
    }
    fit.missingColumns.sort((a, b) => a.missing.length - b.missing.length);
    return fit;
};

/**
 * Columns to add for the given names, each with the first variable that suggests that name and has values for
 * the period type, so adding a model's missing columns often needs no further choice.
 */
export const columnsFor = (names: string[], variables: DatasetVariable[], periodType: string): DatasetColumn[] => names.map(name => ({
    name,
    variableId: variables.find(variable => suggestColumnName(variable) === name && isAvailableFor(variable, periodType))?.id ?? '',
}));

/**
 * The columns for a new period type: a column whose variable has no values for it switches to one that suggests
 * the same column name and has, such as weekly instead of monthly precipitation. Other columns stay as they are.
 */
export const columnsForPeriodType = (columns: DatasetColumn[], variables: DatasetVariable[], periodType: string): DatasetColumn[] => (
    columns.map((column) => {
        const current = variables.find(variable => variable.id === column.variableId);
        if (!current || isAvailableFor(current, periodType)) return column;
        const name = suggestColumnName(current);
        const replacement = variables.find(variable => suggestColumnName(variable) === name && isAvailableFor(variable, periodType));
        return replacement ? { ...column, variableId: replacement.id } : column;
    })
);

/**
 * The draft's columns as Chap Core dataset data sources: which variable each covariate came from. Chap Core only
 * stores this record; the values themselves go in the request's `providedData`. The Modeling app reads these ids as
 * DHIS2 data items, to suggest data and fetch it again for new predictions.
 */
export const toDataSources = (draft: DatasetDraft): DataSource[] => draft.columns.map(column => ({
    covariate: column.name.trim(),
    dataElementId: column.variableId,
}));
