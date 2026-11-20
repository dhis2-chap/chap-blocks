import { useMemo, useState, type ReactNode } from 'react';
import i18n from '@dhis2/d2-i18n';
import {
    Button,
    ButtonStrip,
    Checkbox,
    DataTable,
    DataTableBody,
    DataTableCell,
    DataTableColumnHeader,
    DataTableHead,
    DataTableRow,
    DataTableToolbar,
    Tag,
} from '@dhis2/ui';
import { AlertApproval, type AlertRead } from '@chap-blocks/api';
import { getStatus, groupByLevel, groupByOrgUnit } from './signalReview';
import styles from './SignalReviewTable.module.css';

export type SignalReview = {
    alertIds: number[];
    decision: AlertApproval;
};

export type SignalReviewTableProps<T extends AlertRead = AlertRead> = {
    alerts: T[];
    orgUnitNames: ReadonlyMap<string, string>;
    formatPeriod: (period: string) => string;
    onReview: (review: SignalReview) => void;
    // The review being saved: its rows show progress and every other action waits for it.
    saving?: SignalReview;
    disabled?: boolean;
    // Replaces the plain level name, for example with the host's coloured tag.
    renderLevel?: (alert: T) => ReactNode;
    // Evidence behind an organisation unit's signals, shown when its row is expanded.
    renderDetails?: (alerts: T[]) => ReactNode;
    // Ranks a signal's level, higher being more severe. With it, organisation units can be selected by level.
    getSeverity?: (alert: T) => number;
};

const CHECKBOX_COLUMN_WIDTH = '48px';

// Data, identity and persistence belong to the host app, so this view can also be used in a Chap block.
export const SignalReviewTable = <T extends AlertRead = AlertRead>({
    alerts,
    orgUnitNames,
    formatPeriod,
    onReview,
    saving,
    disabled,
    renderLevel,
    renderDetails,
    getSeverity,
}: SignalReviewTableProps<T>) => {
    const [selectedOrgUnits, setSelectedOrgUnits] = useState<ReadonlySet<string>>(new Set());
    const [expandedOrgUnit, setExpandedOrgUnit] = useState<string>();
    const groups = useMemo(() => groupByOrgUnit(alerts, getSeverity), [alerts, getSeverity]);
    const levels = useMemo(() => (getSeverity ? groupByLevel(groups, getSeverity) : []), [groups, getSeverity]);
    // Only pending signals can be selected, so a bulk decision never overturns an earlier one.
    const pendingGroups = groups.filter(group => group.pendingIds.length > 0);
    const selectedGroups = pendingGroups.filter(group => selectedOrgUnits.has(group.orgUnit));
    // Reviewed organisation units leave the selection, so one that returns to pending is never already ticked.
    if (selectedOrgUnits.size > selectedGroups.length) {
        setSelectedOrgUnits(new Set(selectedGroups.map(group => group.orgUnit)));
    }
    const selectedIds = selectedGroups.flatMap(group => group.pendingIds);
    const isBusy = disabled || saving !== undefined;

    const setSelected = (orgUnits: string[], selected: boolean) => setSelectedOrgUnits((previous) => {
        const next = new Set(previous);
        for (const orgUnit of orgUnits) {
            if (selected) next.add(orgUnit);
            else next.delete(orgUnit);
        }
        return next;
    });

    const reviewButton = (alertIds: number[], decision: AlertApproval, label: string) => (
        <Button
            small
            disabled={isBusy}
            loading={saving?.decision === decision && saving.alertIds.includes(alertIds[0])}
            onClick={() => onReview({ alertIds, decision })}
        >
            {label}
        </Button>
    );

    return (
        <div>
            <DataTableToolbar className={styles.toolbar}>
                <div className={styles.selection}>
                    <span>
                        {i18n.t('{{selected}} of {{pending}} pending signals selected', {
                            selected: selectedIds.length,
                            pending: pendingGroups.flatMap(group => group.pendingIds).length,
                        })}
                    </span>
                    {/* With a single level left, selecting it is the same as selecting everything. */}
                    {levels.length > 1 && (
                        <span className={styles.levels}>
                            {i18n.t('Select by level')}
                            {levels.map(({ name, orgUnits }) => {
                                const isSelected = orgUnits.every(orgUnit => selectedOrgUnits.has(orgUnit));
                                return (
                                    <Button
                                        key={name}
                                        small
                                        toggled={isSelected}
                                        disabled={isBusy}
                                        dataTest={`signal-review-select-level-${name}`}
                                        onClick={() => setSelected(orgUnits, !isSelected)}
                                    >
                                        {name}
                                    </Button>
                                );
                            })}
                        </span>
                    )}
                </div>
                <ButtonStrip>
                    <Button
                        small
                        disabled={isBusy || selectedIds.length === 0}
                        onClick={() => onReview({ alertIds: selectedIds, decision: AlertApproval.DECLINED })}
                    >
                        {i18n.t('Decline selected')}
                    </Button>
                    <Button
                        small
                        primary
                        disabled={isBusy || selectedIds.length === 0}
                        onClick={() => onReview({ alertIds: selectedIds, decision: AlertApproval.APPROVED })}
                    >
                        {i18n.t('Approve selected')}
                    </Button>
                </ButtonStrip>
            </DataTableToolbar>
            <DataTable scrollWidth="100%">
                <DataTableHead>
                    <DataTableRow>
                        {renderDetails && <DataTableColumnHeader />}
                        <DataTableColumnHeader width={CHECKBOX_COLUMN_WIDTH}>
                            <Checkbox
                                dataTest="signal-review-select-all"
                                checked={pendingGroups.length > 0 && selectedGroups.length === pendingGroups.length}
                                indeterminate={selectedGroups.length > 0 && selectedGroups.length < pendingGroups.length}
                                disabled={isBusy || pendingGroups.length === 0}
                                onChange={({ checked }) => setSelectedOrgUnits(new Set(
                                    checked ? pendingGroups.map(group => group.orgUnit) : [],
                                ))}
                            />
                        </DataTableColumnHeader>
                        <DataTableColumnHeader>{i18n.t('Organisation unit')}</DataTableColumnHeader>
                        <DataTableColumnHeader>{i18n.t('Signals')}</DataTableColumnHeader>
                        <DataTableColumnHeader>{i18n.t('Status')}</DataTableColumnHeader>
                        <DataTableColumnHeader>{i18n.t('Reviewed by')}</DataTableColumnHeader>
                        <DataTableColumnHeader>{i18n.t('Actions')}</DataTableColumnHeader>
                    </DataTableRow>
                </DataTableHead>
                <DataTableBody>
                    {groups.map(({ orgUnit, signals, pendingIds }) => {
                        const isPending = pendingIds.length > 0;
                        const isSelected = isPending && selectedOrgUnits.has(orgUnit);
                        const isExpanded = expandedOrgUnit === orgUnit;
                        return (
                            <DataTableRow
                                key={orgUnit}
                                dataTest={`signal-review-${orgUnit}`}
                                selected={isSelected}
                                // Every row needs content to get its expand handle; only the open one builds its evidence.
                                expandableContent={renderDetails && <>{isExpanded && renderDetails(signals)}</>}
                                expanded={isExpanded}
                                onExpandToggle={renderDetails && (() => setExpandedOrgUnit(isExpanded ? undefined : orgUnit))}
                            >
                                <DataTableCell width={CHECKBOX_COLUMN_WIDTH}>
                                    {isPending && (
                                        <Checkbox
                                            checked={isSelected}
                                            disabled={isBusy}
                                            onChange={({ checked }) => setSelected([orgUnit], checked)}
                                        />
                                    )}
                                </DataTableCell>
                                <DataTableCell>{orgUnitNames.get(orgUnit) ?? orgUnit}</DataTableCell>
                                <DataTableCell>
                                    <div className={styles.list}>
                                        {signals.map(signal => (
                                            <span key={signal.id} className={styles.signal}>
                                                {/* Wrapped so the flex gap separates them; adjacent text would merge into one item. */}
                                                <span>{formatPeriod(signal.timePeriod)}</span>
                                                {renderLevel ? renderLevel(signal) : <span>{signal.level}</span>}
                                            </span>
                                        ))}
                                    </div>
                                </DataTableCell>
                                <DataTableCell>
                                    <div className={styles.list}>
                                        {[...new Set(signals.map(getStatus))].map(status => (
                                            <Tag
                                                key={status}
                                                positive={status === AlertApproval.APPROVED}
                                                negative={status === AlertApproval.DECLINED}
                                                neutral={status === AlertApproval.PENDING}
                                            >
                                                {status === AlertApproval.APPROVED
                                                    ? i18n.t('Approved')
                                                    : status === AlertApproval.DECLINED ? i18n.t('Declined') : i18n.t('Pending')}
                                            </Tag>
                                        ))}
                                    </div>
                                </DataTableCell>
                                <DataTableCell>
                                    {[...new Set(signals.flatMap(signal => signal.approvedBy ?? []))].join(', ') || '–'}
                                </DataTableCell>
                                <DataTableCell className={styles.actions}>
                                    {isPending
                                        ? (
                                                <ButtonStrip>
                                                    {reviewButton(pendingIds, AlertApproval.APPROVED, i18n.t('Approve'))}
                                                    {reviewButton(pendingIds, AlertApproval.DECLINED, i18n.t('Decline'))}
                                                </ButtonStrip>
                                            )
                                        : reviewButton(signals.map(signal => signal.id), AlertApproval.PENDING, i18n.t('Reset to pending'))}
                                </DataTableCell>
                            </DataTableRow>
                        );
                    })}
                </DataTableBody>
            </DataTable>
        </div>
    );
};
