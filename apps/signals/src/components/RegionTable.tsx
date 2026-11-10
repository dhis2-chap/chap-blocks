import i18n from '@dhis2/d2-i18n';
import { AlertApproval } from '@chap-blocks/api';
import { getPeriodNameFromId } from '@chap-blocks/ui';
import { NO_SIGNAL_DISPLAY } from '../alertDisplay';
import type { RegionSignal } from '../signals';
import { ApprovalTag, LevelTag } from './Tags';

type Props = {
    regions: RegionSignal[];
    selectedId?: string;
    onSelect: (orgUnitId: string) => void;
};

const STATUSES = [AlertApproval.APPROVED, AlertApproval.PENDING, AlertApproval.DECLINED];

/** Regions ranked by their highest signal level; regions without signals follow. */
export const RegionTable = ({ regions, selectedId, onSelect }: Props) => (
    <div className="table-scroll">
        <table className="region-table">
            <thead>
                <tr>
                    <th scope="col">{i18n.t('Region')}</th>
                    <th scope="col">{i18n.t('Highest signal')}</th>
                    <th scope="col" className="periods-head">{i18n.t('Periods')}</th>
                    <th scope="col">{i18n.t('Approval')}</th>
                </tr>
            </thead>
            <tbody>
                {regions.map(region => (
                    <tr
                        key={region.orgUnitId}
                        className={[region.orgUnitId === selectedId && 'selected', !region.top && 'quiet'].filter(Boolean).join(' ')}
                        onClick={() => onSelect(region.orgUnitId)}
                    >
                        <th scope="row">
                            <button
                                type="button"
                                className="row-button"
                                aria-pressed={region.orgUnitId === selectedId}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onSelect(region.orgUnitId);
                                }}
                            >
                                {region.name}
                            </button>
                        </th>
                        <td>{region.top ? <LevelTag display={region.top.display} /> : <span className="muted">{NO_SIGNAL_DISPLAY.label}</span>}</td>
                        <td className="periods">
                            {[...new Set(region.alerts.map(alert => alert.timePeriod))]
                                .sort()
                                .map(period => getPeriodNameFromId(period, 'short'))
                                .join(', ') || '—'}
                        </td>
                        <td>
                            <span className="tags">
                                {STATUSES.filter(status => region.approval[status] > 0).map(status => (
                                    <ApprovalTag key={status} status={status} count={region.approval[status]} />
                                ))}
                                {!region.alerts.length && '—'}
                            </span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);
