import { describe, expect, it } from 'vitest';
import { AlertApproval, type AlertRead } from '@chap-blocks/api';
import { getStatus, groupByLevel, groupByOrgUnit } from './signalReview';

const alert = (id: number, orgUnit: string, timePeriod: string, level: string, approved?: AlertApproval): AlertRead => ({
    id, orgUnit, timePeriod, level, approved, alertPolicyId: 1,
});
const severity = (signal: AlertRead) => (signal.level === 'action' ? 2 : 1);

describe('signal review grouping', () => {
    it('treats an alert without a review state as pending', () => {
        expect(getStatus(alert(1, 'A', '202401', 'watch'))).toBe(AlertApproval.PENDING);
    });

    it('groups by org unit, sorts by period and keeps only pending ids selectable', () => {
        const [a, b] = groupByOrgUnit([
            alert(1, 'A', '202403', 'watch'),
            alert(2, 'B', '202401', 'watch', AlertApproval.APPROVED),
            alert(3, 'A', '202401', 'action', AlertApproval.DECLINED),
        ]);
        expect(a.orgUnit).toBe('A');
        expect(a.signals.map(signal => signal.id)).toEqual([3, 1]);
        expect(a.pendingIds).toEqual([1]);
        expect(b.pendingIds).toEqual([]);
        expect(a.mostSevere).toBeUndefined();
    });

    it('selects an org unit by its most severe pending level, most severe level first', () => {
        const groups = groupByOrgUnit([
            alert(1, 'A', '202401', 'watch'),
            alert(2, 'A', '202402', 'action'),
            alert(3, 'B', '202401', 'watch'),
            // A reviewed signal does not decide the level an org unit is selected by.
            alert(4, 'B', '202402', 'action', AlertApproval.APPROVED),
            alert(5, 'C', '202401', 'action', AlertApproval.APPROVED),
        ], severity);
        expect(groupByLevel(groups, severity)).toEqual([
            { name: 'action', severity: 2, orgUnits: ['A'] },
            { name: 'watch', severity: 1, orgUnits: ['B'] },
        ]);
    });
});
