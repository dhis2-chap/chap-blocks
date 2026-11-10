import { AlertApproval, type AlertPolicyRead, type AlertRead, type PredictionInfo } from '@chap-blocks/api';
import { canonicalizePeriodId } from '@chap-blocks/core';
import { getLevelDisplay, type AlertPolicyDisplay, type LevelDisplay } from './alertDisplay';

export type DisplayedAlert = AlertRead & { display: LevelDisplay; severity: number };

export type RegionSignal = {
    orgUnitId: string;
    name: string;
    /** Signals in the selected scope, most severe first. */
    alerts: DisplayedAlert[];
    top?: DisplayedAlert;
    approval: Record<AlertApproval, number>;
};

/** Ranks alerts by their level's position in the policy, as the modeling package does. */
export const displayAlerts = (
    alerts: AlertRead[],
    policies: AlertPolicyRead[],
    displays: Record<number, AlertPolicyDisplay | undefined>,
): DisplayedAlert[] => alerts.map((alert) => {
    const policy = policies.find(item => item.id === alert.alertPolicyId);
    return {
        ...alert,
        display: getLevelDisplay(alert.level, policy, displays[alert.alertPolicyId]),
        severity: policy?.levels?.findIndex(level => level.name === alert.level) ?? -1,
    };
}).sort((a, b) => b.severity - a.severity || comparePeriodIds(a.timePeriod, b.timePeriod));

export const latestPrediction = (predictions: PredictionInfo[] | undefined) =>
    [...predictions ?? []].sort((a, b) => b.created.localeCompare(a.created) || b.id - a.id)[0];

export const approvalOf = (alert: AlertRead) => alert.approved ?? AlertApproval.PENDING;

export const buildRegionSignals = ({
    orgUnitIds,
    names,
    alerts,
    period,
    approvedOnly,
}: {
    orgUnitIds: string[];
    names: Map<string, string>;
    alerts: DisplayedAlert[];
    period?: string;
    approvedOnly: boolean;
}): RegionSignal[] => {
    const wanted = period ? canonicalizePeriodId(period) : undefined;
    const inScope = alerts.filter(alert =>
        (!wanted || canonicalizePeriodId(alert.timePeriod) === wanted)
        && (!approvedOnly || approvalOf(alert) === AlertApproval.APPROVED));
    // Alerts may name regions outside the setup's list; keep them visible.
    const ids = [...new Set([...orgUnitIds, ...inScope.map(alert => alert.orgUnit)])];
    return ids.map((orgUnitId) => {
        const regionAlerts = inScope.filter(alert => alert.orgUnit === orgUnitId);
        const approval = { pending: 0, approved: 0, declined: 0 };
        regionAlerts.forEach((alert) => { approval[approvalOf(alert)] += 1; });
        return {
            orgUnitId,
            name: names.get(orgUnitId) ?? orgUnitId,
            alerts: regionAlerts,
            top: regionAlerts[0],
            approval,
        };
    }).sort((a, b) =>
        (b.top?.severity ?? -2) - (a.top?.severity ?? -2)
        || b.alerts.length - a.alerts.length
        || a.name.localeCompare(b.name));
};

export type LevelCount = { level: string; display: LevelDisplay; severity: number; regions: number };

/**
 * Every level of the run's policy (most severe first) with the number of regions whose
 * highest signal is that level. Levels raised by another policy are appended.
 */
export const levelSummary = (
    regions: RegionSignal[],
    policy: AlertPolicyRead | undefined,
    display: AlertPolicyDisplay | undefined,
): LevelCount[] => {
    const byLevel = new Map<string, LevelCount>();
    (policy?.levels ?? []).forEach((level, severity) => byLevel.set(level.name, {
        level: level.name,
        display: getLevelDisplay(level.name, policy, display),
        severity,
        regions: 0,
    }));
    for (const region of regions) {
        if (!region.top) continue;
        const entry = byLevel.get(region.top.level)
            ?? { level: region.top.level, display: region.top.display, severity: region.top.severity, regions: 0 };
        entry.regions += 1;
        byLevel.set(region.top.level, entry);
    }
    return [...byLevel.values()].sort((a, b) => b.severity - a.severity);
};

/** Chronological order for period ids; numeric collation keeps 2025W2 before 2025W10. */
export const comparePeriodIds = (a: string, b: string) =>
    canonicalizePeriodId(a).localeCompare(canonicalizePeriodId(b), 'en', { numeric: true });

export const sortPeriods = (periods: string[]) => [...periods].sort(comparePeriodIds);
