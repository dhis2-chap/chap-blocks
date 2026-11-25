import i18n from '@dhis2/d2-i18n';
import type { DataSource } from '@chap-blocks/api';

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
    /** Period type ids the variable has values for. Leave out when it has values for every period type. */
    periodTypes?: string[];
};

/**
 * A place a dataset can cover. With `parentId`, locations form a hierarchy, such as DHIS2 org units:
 * only locations without children go into a dataset, and the others group them.
 */
export type DatasetLocation = { id: string; name: string; parentId?: string };

export type DatasetPeriod = { id: string; name: string };

/** A period type the host can supply, with its periods in chronological order. */
export type DatasetPeriodType = { id: string; name: string; periods: DatasetPeriod[] };

/** What a model needs from a dataset, so the builder can show which models will run on it. */
export type DatasetModel = {
    id: string;
    name: string;
    columns: string[];
    /** Period type ids the model accepts. Leave out when it accepts any. */
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

const sameId = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();

export const isAvailableFor = (variable: DatasetVariable, periodType: string) => (
    !variable.periodTypes || variable.periodTypes.some(id => sameId(id, periodType))
);

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

/** The periods from start to end, inclusive; empty when either is unknown or they are reversed. */
export const getDraftPeriods = (draft: DatasetDraft, periodTypes: DatasetPeriodType[]): DatasetPeriod[] => {
    const periods = periodTypes.find(type => type.id === draft.periodType)?.periods ?? [];
    const start = periods.findIndex(period => period.id === draft.startPeriod);
    const end = periods.findIndex(period => period.id === draft.endPeriod);
    return start < 0 || end < start ? [] : periods.slice(start, end + 1);
};

export const validateDatasetDraft = (draft: DatasetDraft, { variables, periodTypes }: DatasetOptions): DatasetDraftErrors => {
    const errors: DatasetDraftErrors = { columnErrors: [] };
    const periodType = periodTypes.find(type => type.id === draft.periodType);
    const periodIds = periodType?.periods.map(period => period.id) ?? [];

    if (!draft.name.trim()) errors.name = i18n.t('Name the dataset');
    if (!periodType) errors.periodType = i18n.t('Choose a period type');
    if (!periodIds.includes(draft.startPeriod)) errors.startPeriod = i18n.t('Choose a start period');
    if (!periodIds.includes(draft.endPeriod)) errors.endPeriod = i18n.t('Choose an end period');
    else if (!errors.startPeriod && periodIds.indexOf(draft.endPeriod) < periodIds.indexOf(draft.startPeriod)) {
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
        if (periodType && model.periodTypes && !model.periodTypes.some(id => sameId(id, periodType))) {
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

/** The draft's columns as Chap Core dataset data sources: each covariate and the variable id it comes from. */
export const toDataSources = (draft: DatasetDraft): DataSource[] => draft.columns.map(column => ({
    covariate: column.name.trim(),
    dataElementId: column.variableId,
}));
