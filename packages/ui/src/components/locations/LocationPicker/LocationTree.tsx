import { useMemo, useState } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Checkbox, IconChevronDown16, IconChevronRight16 } from '@dhis2/ui';
import { groupLocationsByParent, leafIdsUnder, type LocationOption } from './locationHierarchy';
import styles from './LocationPicker.module.css';

type LocationTreeProps = {
    locations: LocationOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    disabled?: boolean;
};

/** Checkboxes for a location hierarchy. Only locations without children are selected; checking a group checks them all. */
export const LocationTree = ({ locations, selected, onChange, disabled }: LocationTreeProps) => {
    const children = useMemo(() => groupLocationsByParent(locations), [locations]);
    const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
    const isSelected = new Set(selected);

    const toggleOpen = (id: string) => setOpen((current) => {
        const next = new Set(current);
        if (!next.delete(id)) next.add(id);
        return next;
    });
    const check = (leaves: string[], checked: boolean) => {
        const changed = new Set(leaves);
        const rest = selected.filter(id => !changed.has(id));
        onChange(checked ? [...rest, ...leaves] : rest);
    };

    const renderLevel = (parentId: string) => (
        <ul className={styles.treeLevel}>
            {children.get(parentId)?.map((location) => {
                const leaves = leafIdsUnder(location.id, children);
                const count = leaves.filter(id => isSelected.has(id)).length;
                const isGroup = children.has(location.id);
                const isOpen = open.has(location.id);
                return (
                    <li key={location.id}>
                        <div className={styles.treeNode}>
                            {isGroup ? (
                                <button
                                    type="button"
                                    className={styles.treeToggle}
                                    aria-expanded={isOpen}
                                    aria-label={isOpen
                                        ? i18n.t('Collapse {{name}}', { name: location.name, interpolation: { escapeValue: false } })
                                        : i18n.t('Expand {{name}}', { name: location.name, interpolation: { escapeValue: false } })}
                                    onClick={() => toggleOpen(location.id)}
                                >
                                    {isOpen ? <IconChevronDown16 /> : <IconChevronRight16 />}
                                </button>
                            ) : <span className={styles.treeToggle} />}
                            <Checkbox
                                dense
                                label={isGroup ? `${location.name} (${count}/${leaves.length})` : location.name}
                                checked={count > 0 && count === leaves.length}
                                indeterminate={count > 0 && count < leaves.length}
                                disabled={disabled}
                                onChange={({ checked }) => check(leaves, checked)}
                            />
                        </div>
                        {isGroup && isOpen && renderLevel(location.id)}
                    </li>
                );
            })}
        </ul>
    );

    return <div className={styles.tree}>{renderLevel('')}</div>;
};
