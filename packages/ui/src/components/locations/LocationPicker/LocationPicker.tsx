import i18n from '@dhis2/d2-i18n';
import { Button, Field, MultiSelectField, MultiSelectOption } from '@dhis2/ui';
import { getLeafLocationIds, type LocationOption } from './locationHierarchy';
import { LocationTree } from './LocationTree';
import styles from './LocationPicker.module.css';

export type LocationPickerProps = {
    /** From any source. A flat list shows as a multi-select; with `parentId`s it shows as a tree. */
    locations: LocationOption[];
    /** Ids of chosen locations. In a tree only locations without children are chosen; the others group them. */
    selected: string[];
    onChange: (selected: string[]) => void;
    label?: string;
    disabled?: boolean;
    /** Shown under the field, which is then marked invalid. */
    error?: string;
    dataTest?: string;
};

export const LocationPicker = ({
    locations,
    selected,
    onChange,
    label = i18n.t('Locations'),
    disabled,
    error,
    dataTest,
}: LocationPickerProps) => {
    const isTree = locations.some(location => location.parentId);
    const selectable = getLeafLocationIds(locations);

    return (
        <div data-test={dataTest}>
            {isTree ? (
                <Field label={label} error={!!error} validationText={error} disabled={disabled}>
                    <div role="group" aria-label={label}>
                        <LocationTree locations={locations} selected={selected} onChange={onChange} disabled={disabled} />
                    </div>
                </Field>
            ) : (
                <MultiSelectField
                    label={label}
                    selected={selected}
                    onChange={({ selected: next }) => onChange(next)}
                    error={!!error}
                    validationText={error}
                    disabled={disabled}
                    filterable
                    clearable
                    noMatchText={i18n.t('No locations match')}
                >
                    {locations.map(location => <MultiSelectOption key={location.id} value={location.id} label={location.name} />)}
                </MultiSelectField>
            )}
            {selectable.length > 1 && selectable.some(id => !selected.includes(id)) && (
                <Button small secondary className={styles.selectAll} disabled={disabled} onClick={() => onChange(selectable)}>
                    {i18n.t('Select all {{count}} locations', { count: selectable.length })}
                </Button>
            )}
        </div>
    );
};
