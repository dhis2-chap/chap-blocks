import { useMemo, useState, type ReactNode } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    Field,
    IconAdd16,
    IconDelete16,
    InputField,
    SingleSelectField,
    SingleSelectOption,
    Tag,
} from '@dhis2/ui';
import type { Dhis2Calendar } from '@chap-blocks/core';
import {
    columnsFor,
    emptyDatasetDraft,
    getDraftPeriods,
    getModelFit,
    hasErrors,
    isAvailableFor,
    resolveTargetColumn,
    suggestColumnName,
    validateDatasetDraft,
    type DatasetColumn,
    type DatasetDraft,
    type DatasetModel,
    type DatasetPeriodType,
    type DatasetVariable,
} from './datasetDraft';
import { getLeafLocationIds, type LocationOption } from '../../locations/LocationPicker/locationHierarchy';
import { LocationPicker } from '../../locations/LocationPicker/LocationPicker';
import { PeriodRangeField } from '../../../ui/PeriodPicker/PeriodRangeField';
import { useKeepScrollOnOpen } from './useKeepScrollOnOpen';
import styles from './DatasetBuilder.module.css';

/** What a host's own location picker gets from `renderLocations`. */
export type DatasetLocationPickerProps = {
    selected: string[];
    onChange: (selected: string[]) => void;
    disabled: boolean;
    error: boolean;
};

export type DatasetBuilderProps = {
    /** Everything the host can supply values for, from any source. */
    variables: DatasetVariable[];
    /** A flat list shows as a multi-select; with `parentId`s it shows as a tree. Ignored with `renderLocations`. */
    locations?: LocationOption[];
    /** Replaces the built-in location picker, for example with a lazily loaded DHIS2 org unit tree. */
    renderLocations?: (props: DatasetLocationPickerProps) => ReactNode;
    /** DHIS2 period types, e.g. `[{ id: 'MONTHLY', name: 'Monthly' }]`. With one, the period type field is hidden. */
    periodTypes: DatasetPeriodType[];
    /** The DHIS2 calendar to show periods in, e.g. `ethiopian`. Defaults to `gregory`. */
    calendar?: Dhis2Calendar;
    locale?: string;
    /**
     * Called with a valid draft: names trimmed, target resolved. Fetching values and saving the dataset belong to
     * the host, which looks up each column's `variableId` in its own variables to know where the values come from.
     */
    onSubmit: (draft: DatasetDraft) => void;
    /** With models, a side panel shows which ones can run on the dataset and adds the columns they miss. */
    models?: DatasetModel[];
    /** The draft to start from. Change the component's `key` to start again. */
    initialDraft?: Partial<DatasetDraft>;
    /** Every edit, as typed and not yet validated, for example to keep a draft. */
    onChange?: (draft: DatasetDraft) => void;
    onCancel?: () => void;
    submitLabel?: string;
    /** Shows progress on the submit button and locks the form while the host saves. */
    submitting?: boolean;
    disabled?: boolean;
    /** Host content under the form, such as a save error or a data check. */
    children?: ReactNode;
};

const EMPTY_COLUMN: DatasetColumn = { name: '', variableId: '' };

const variableLabel = (variable: DatasetVariable) => (variable.source ? `${variable.name} · ${variable.source}` : variable.name);

export const DatasetBuilder = ({
    variables,
    locations = [],
    renderLocations,
    periodTypes,
    calendar = 'gregory',
    locale,
    onSubmit,
    models,
    initialDraft,
    onChange,
    onCancel,
    submitLabel = i18n.t('Create dataset'),
    submitting,
    disabled,
    children,
}: DatasetBuilderProps) => {
    const [stored, setStored] = useState<DatasetDraft>(() => ({
        ...emptyDatasetDraft(),
        // Leave out `undefined`s, which would replace the defaults.
        ...Object.fromEntries(Object.entries(initialDraft ?? {}).filter(([, value]) => value !== undefined)),
    }));
    // Period types and locations can arrive or change after mount, so the draft follows them without losing
    // the stored choices: an unknown period type falls back to the first, unknown locations are left out.
    const selectable = useMemo(() => new Set(getLeafLocationIds(locations)), [locations]);
    const draft: DatasetDraft = {
        ...stored,
        periodType: periodTypes.some(type => type.id === stored.periodType) ? stored.periodType : periodTypes[0]?.id ?? '',
        locationIds: renderLocations ? stored.locationIds : stored.locationIds.filter(id => selectable.has(id)),
    };
    // Errors show once the user tries to submit, then follow every edit.
    const [showErrors, setShowErrors] = useState(false);
    const keepScroll = useKeepScrollOnOpen();
    const errors = validateDatasetDraft(draft, { variables, periodTypes, calendar });
    const shown = showErrors ? errors : { columnErrors: [] };
    const isLocked = disabled || submitting;

    const periodType = periodTypes.find(type => type.id === draft.periodType);
    const periodCount = useMemo(
        () => getDraftPeriods({ startPeriod: draft.startPeriod, endPeriod: draft.endPeriod }, calendar).length,
        [draft.startPeriod, draft.endPeriod, calendar],
    );
    const columnNames = [...new Set(draft.columns.map(column => column.name.trim()).filter(Boolean))];
    const targetColumn = resolveTargetColumn(draft);
    const fit = models && getModelFit(columnNames, draft.periodType, models);

    const update = (changes: Partial<DatasetDraft>) => {
        setStored(current => ({ ...current, ...changes }));
        onChange?.({ ...draft, ...changes });
    };
    const updateColumn = (index: number, changes: Partial<DatasetColumn>) => update({
        columns: draft.columns.map((column, i) => (i === index ? { ...column, ...changes } : column)),
    });
    const addColumns = (names: string[]) => update({
        columns: [...draft.columns, ...columnsFor(names.filter(name => !columnNames.includes(name)), variables, draft.periodType)],
    });
    const chooseVariable = (index: number, variableId: string) => {
        const variable = variables.find(candidate => candidate.id === variableId);
        // Name an unnamed column after its data, so a column usually needs one choice.
        const name = draft.columns[index].name.trim() || (variable ? suggestColumnName(variable) : '');
        updateColumn(index, { variableId, name });
    };
    // Period ids belong to one period type, so a new type starts a new range.
    const choosePeriodType = (id: string) => update({ periodType: id, startPeriod: '', endPeriod: '' });
    const submit = () => {
        setShowErrors(true);
        if (hasErrors(errors)) return;
        onSubmit({
            ...draft,
            name: draft.name.trim(),
            columns: draft.columns.map(column => ({ ...column, name: column.name.trim() })),
            targetColumn,
        });
    };

    return (
        <div className={fit ? styles.layout : undefined}>
            <form
                {...keepScroll}
                className={styles.form}
                noValidate
                onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                }}
            >
                <fieldset className={styles.fields} disabled={isLocked}>
                    <InputField
                        label={i18n.t('Dataset name')}
                        value={draft.name}
                        onChange={({ value }) => update({ name: value ?? '' })}
                        error={!!shown.name}
                        validationText={shown.name}
                        disabled={isLocked}
                        dataTest="dataset-builder-name"
                    />

                    <div>
                        {periodTypes.length > 1 && (
                            <SingleSelectField
                                label={i18n.t('Period type')}
                                selected={periodType ? draft.periodType : undefined}
                                onChange={({ selected }) => choosePeriodType(selected)}
                                error={!!shown.periodType}
                                validationText={shown.periodType}
                                disabled={isLocked}
                                dataTest="dataset-builder-period-type"
                            >
                                {periodTypes.map(type => <SingleSelectOption key={type.id} value={type.id} label={type.name} />)}
                            </SingleSelectField>
                        )}
                        {periodType && (
                            <PeriodRangeField
                                // Remount on a new period type, so the pickers open on a year that has its periods.
                                key={periodType.id}
                                className={periodTypes.length > 1 ? undefined : styles.periodsOnly}
                                periodType={periodType.id}
                                calendar={calendar}
                                locale={locale}
                                fromValue={draft.startPeriod || null}
                                toValue={draft.endPeriod || null}
                                minPeriodId={periodType.minPeriodId}
                                maxPeriodId={periodType.maxPeriodId}
                                disabled={isLocked}
                                fromLabel={i18n.t('From')}
                                toLabel={i18n.t('To')}
                                fromError={shown.startPeriod}
                                toError={shown.endPeriod}
                                fromDataTest="dataset-builder-startPeriod"
                                toDataTest="dataset-builder-endPeriod"
                                onFromChange={period => update({ startPeriod: period.id })}
                                onToChange={period => update({ endPeriod: period.id })}
                            />
                        )}
                    </div>

                    {renderLocations ? (
                        <Field
                            label={i18n.t('Locations')}
                            error={!!shown.locationIds}
                            validationText={shown.locationIds}
                            disabled={isLocked}
                            dataTest="dataset-builder-locations"
                        >
                            <div role="group" aria-label={i18n.t('Locations')}>
                                {renderLocations({
                                    selected: draft.locationIds,
                                    onChange: selected => update({ locationIds: selected }),
                                    disabled: !!isLocked,
                                    error: !!shown.locationIds,
                                })}
                            </div>
                        </Field>
                    ) : (
                        <LocationPicker
                            locations={locations}
                            selected={draft.locationIds}
                            onChange={selected => update({ locationIds: selected })}
                            disabled={isLocked}
                            error={shown.locationIds}
                            dataTest="dataset-builder-locations"
                        />
                    )}

                    <section className={styles.columns} aria-labelledby="dataset-builder-columns">
                        <h4 id="dataset-builder-columns" className={styles.heading}>{i18n.t('Columns')}</h4>
                        <p className={styles.help}>{i18n.t('Each column is named the way models read it and takes its values from one variable.')}</p>
                        {draft.columns.map((column, index) => {
                            const columnErrors = shown.columnErrors[index] ?? {};
                            // Keep the chosen variable listed after a period type change, so its error can name it.
                            const options = variables.filter(variable => (
                                variable.id === column.variableId || isAvailableFor(variable, draft.periodType)
                            ));
                            return (
                                <div key={index} className={styles.column} data-test={`dataset-builder-column-${index}`}>
                                    <SingleSelectField
                                        className={styles.variable}
                                        label={i18n.t('Data')}
                                        selected={options.some(variable => variable.id === column.variableId) ? column.variableId : undefined}
                                        onChange={({ selected }) => chooseVariable(index, selected)}
                                        error={!!columnErrors.variableId}
                                        validationText={columnErrors.variableId}
                                        disabled={isLocked}
                                        filterable
                                        noMatchText={i18n.t('No data matches')}
                                    >
                                        {options.map(variable => (
                                            <SingleSelectOption key={variable.id} value={variable.id} label={variableLabel(variable)} />
                                        ))}
                                    </SingleSelectField>
                                    <InputField
                                        className={styles.columnName}
                                        label={i18n.t('Column name')}
                                        value={column.name}
                                        onChange={({ value }) => updateColumn(index, { name: value ?? '' })}
                                        error={!!columnErrors.name}
                                        validationText={columnErrors.name}
                                        disabled={isLocked}
                                    />
                                    <Button
                                        small
                                        secondary
                                        className={styles.remove}
                                        icon={<IconDelete16 />}
                                        aria-label={i18n.t('Remove column')}
                                        title={i18n.t('Remove column')}
                                        disabled={isLocked}
                                        onClick={() => update({ columns: draft.columns.filter((_, i) => i !== index) })}
                                    />
                                </div>
                            );
                        })}
                        {shown.columns && <p className={styles.error}>{shown.columns}</p>}
                        <Button
                            small
                            icon={<IconAdd16 />}
                            disabled={isLocked}
                            onClick={() => update({ columns: [...draft.columns, EMPTY_COLUMN] })}
                            dataTest="dataset-builder-add-column"
                        >
                            {i18n.t('Add column')}
                        </Button>
                    </section>

                    {columnNames.length > 0 && (
                        <SingleSelectField
                            label={i18n.t('Target column')}
                            helpText={i18n.t('The column models predict.')}
                            selected={targetColumn || undefined}
                            onChange={({ selected }) => update({ targetColumn: selected })}
                            error={!!shown.targetColumn}
                            validationText={shown.targetColumn}
                            disabled={isLocked}
                            dataTest="dataset-builder-target"
                        >
                            {columnNames.map(name => <SingleSelectOption key={name} value={name} label={name} />)}
                        </SingleSelectField>
                    )}
                </fieldset>

                <div className={styles.footer}>
                    <span className={styles.summary} aria-live="polite">
                        {i18n.t('Columns: {{columns}} · Locations: {{locations}} · Periods: {{periods}}', {
                            columns: columnNames.length,
                            locations: draft.locationIds.length,
                            periods: periodCount,
                        })}
                    </span>
                    <ButtonStrip end>
                        {onCancel && <Button disabled={submitting} onClick={onCancel}>{i18n.t('Cancel')}</Button>}
                        <Button primary type="submit" loading={submitting} disabled={isLocked} dataTest="dataset-builder-submit">
                            {submitLabel}
                        </Button>
                    </ButtonStrip>
                </div>

                {children}
            </form>

            {fit && (
                <aside className={styles.models} aria-labelledby="dataset-builder-models">
                    <h4 id="dataset-builder-models" className={styles.heading}>{i18n.t('Models')}</h4>
                    <p className={styles.help}>
                        {i18n.t('{{supported}} of {{total}} models can run on this dataset.', {
                            supported: fit.supported.length,
                            total: models.length,
                        })}
                    </p>
                    {fit.supported.length > 0 && (
                        <ul className={styles.modelList}>
                            {fit.supported.map(model => (
                                <li key={model.id}><Tag positive>{model.name}</Tag></li>
                            ))}
                        </ul>
                    )}
                    {fit.missingColumns.length > 0 && (
                        <>
                            <h5 className={styles.subheading}>{i18n.t('Missing columns')}</h5>
                            <ul className={styles.modelList}>
                                {fit.missingColumns.map(({ model, missing }) => (
                                    <li key={model.id} className={styles.missing}>
                                        <span>
                                            <strong>{model.name}</strong>
                                            <span className={styles.missingNames}>{missing.join(', ')}</span>
                                        </span>
                                        <Button small disabled={isLocked} onClick={() => addColumns(missing)}>
                                            {i18n.t('Add')}
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                    {fit.wrongPeriodType.length > 0 && (
                        <p className={styles.help}>
                            {i18n.t('Not for {{periodType}} data: {{models}}', {
                                periodType: periodType?.name.toLowerCase() ?? draft.periodType,
                                models: fit.wrongPeriodType.map(model => model.name).join(', '),
                                interpolation: { escapeValue: false },
                            })}
                        </p>
                    )}
                </aside>
            )}
        </div>
    );
};
