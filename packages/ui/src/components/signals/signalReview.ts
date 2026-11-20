import { AlertApproval, type AlertRead } from '@chap-blocks/api';

// Older alerts without a review state are pending in Chap.
export const getStatus = (alert: AlertRead) => alert.approved ?? AlertApproval.PENDING;

// One row per organisation unit: its signals share a forecast, so they are reviewed together.
export const groupByOrgUnit = <T extends AlertRead>(alerts: T[], getSeverity?: (alert: T) => number) => {
    const groups = new Map<string, T[]>();
    for (const alert of alerts) {
        groups.set(alert.orgUnit, [...groups.get(alert.orgUnit) ?? [], alert]);
    }
    return [...groups].map(([orgUnit, signals]) => {
        const pending = signals.filter(signal => getStatus(signal) === AlertApproval.PENDING);
        return {
            orgUnit,
            signals: signals.sort((a, b) => a.timePeriod.localeCompare(b.timePeriod)),
            pendingIds: pending.map(signal => signal.id),
            // The organisation unit is selected by its most severe pending signal, so picking a level never brings a more severe signal along.
            mostSevere: getSeverity && pending.length > 0
                ? pending.reduce((top, signal) => (getSeverity(signal) > getSeverity(top) ? signal : top))
                : undefined,
        };
    });
};

// The organisation units to select for each level, most severe level first.
export const groupByLevel = <T extends AlertRead>(groups: ReturnType<typeof groupByOrgUnit<T>>, getSeverity: (alert: T) => number) => {
    const levels = new Map<string, { severity: number; orgUnits: string[] }>();
    for (const { orgUnit, mostSevere } of groups) {
        if (!mostSevere) continue;
        const level = levels.get(mostSevere.level) ?? { severity: getSeverity(mostSevere), orgUnits: [] };
        level.orgUnits.push(orgUnit);
        levels.set(mostSevere.level, level);
    }
    return [...levels].map(([name, level]) => ({ name, ...level })).sort((a, b) => b.severity - a.severity);
};
