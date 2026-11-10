import i18n from '@dhis2/d2-i18n';
import { Tag } from '@dhis2/ui';
import { AlertApproval } from '@chap-blocks/api';
import type { LevelDisplay } from '../alertDisplay';

/** Matches the modeling package's AlertLevelTag: a neutral tag with a coloured dot. */
export const LevelTag = ({ display }: { display: LevelDisplay }) => (
    <Tag maxWidth="100%">
        <span className="level-tag" title={display.label}>
            <span className="level-dot" style={{ background: display.color }} />
            {display.label}
        </span>
    </Tag>
);

export const APPROVAL_LABELS: Record<AlertApproval, string> = {
    [AlertApproval.PENDING]: i18n.t('Awaiting approval'),
    [AlertApproval.APPROVED]: i18n.t('Approved'),
    [AlertApproval.DECLINED]: i18n.t('Declined'),
};

const SHORT_LABELS: Record<AlertApproval, string> = {
    [AlertApproval.PENDING]: i18n.t('pending'),
    [AlertApproval.APPROVED]: i18n.t('approved'),
    [AlertApproval.DECLINED]: i18n.t('declined'),
};

/** With a count, a compact label for table cells (e.g. “2 pending”). */
export const ApprovalTag = ({ status, count }: { status: AlertApproval; count?: number }) => (
    <Tag
        positive={status === AlertApproval.APPROVED}
        negative={status === AlertApproval.DECLINED}
        neutral={status === AlertApproval.PENDING}
    >
        {count === undefined ? APPROVAL_LABELS[status] : `${count} ${SHORT_LABELS[status]}`}
    </Tag>
);
