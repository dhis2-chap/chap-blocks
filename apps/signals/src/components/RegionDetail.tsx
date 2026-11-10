import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import type { AlertPolicyRead } from '@chap-blocks/api';
import { getPeriodNameFromId, getStableMaxYForThresholdChart, type PredictionOrgUnitSeries } from '@chap-blocks/ui';
import { UncertaintyAreaChart } from '@chap-blocks/ui/charts';
import { approvalOf, comparePeriodIds, type RegionSignal } from '../signals';
import { describeError, describeThreshold, usePolicyThresholdLines } from '../queries';
import { ApprovalTag, LevelTag } from './Tags';

type Props = {
    region: RegionSignal;
    series?: PredictionOrgUnitSeries;
    seriesLoading: boolean;
    seriesError: unknown;
    datasetId: number;
    policy?: AlertPolicyRead;
    targetName: string;
};

const formatDate = (value?: string | null) => value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value))
    : undefined;

export const RegionDetail = ({ region, series, seriesLoading, seriesError, datasetId, policy, targetName }: Props) => {
    const thresholds = usePolicyThresholdLines(datasetId, series, policy);
    const alertPeriods = useMemo(() => region.alerts.map(alert => ({
        period: alert.timePeriod,
        label: alert.display.label,
        color: alert.display.background,
    })), [region.alerts]);
    const maxY = useMemo(
        () => series && getStableMaxYForThresholdChart(series, thresholds.data?.flatMap(line => line.points) ?? null),
        [series, thresholds.data],
    );

    return (
        <section className="card region-detail" aria-labelledby="region-title">
            <header className="card-header">
                <div>
                    <h2 id="region-title">{region.name}</h2>
                    <p className="muted small">
                        {i18n.t('Forecast of {{target}} with 50% and 80% uncertainty bands', { target: targetName.toLowerCase() })}
                    </p>
                </div>
                {region.top && <LevelTag display={region.top.display} />}
            </header>
            <div className="detail-layout">
                <div className="chart-area">
                    {seriesLoading && <div className="center"><CircularLoader small /></div>}
                    {!seriesLoading && seriesError != null && (
                        <NoticeBox error title={i18n.t('Could not load the forecast')}>{describeError(seriesError)}</NoticeBox>
                    )}
                    {!seriesLoading && seriesError == null && !series && (
                        <NoticeBox title={i18n.t('No forecast values')}>
                            {i18n.t('The latest run has no forecast values for this region.')}
                        </NoticeBox>
                    )}
                    {series && (
                        <UncertaintyAreaChart
                            series={series}
                            predictionTargetName={targetName}
                            alertPeriods={alertPeriods}
                            thresholdLines={thresholds.data}
                            maxY={maxY}
                            chartHeight={340}
                        />
                    )}
                    {thresholds.error != null && (
                        <p className="muted small">{i18n.t('Signal thresholds unavailable: {{error}}', { error: describeError(thresholds.error) })}</p>
                    )}
                </div>
                <aside className="signal-list" aria-label={i18n.t('Signals for this region')}>
                    <h3>{i18n.t('Signals')}</h3>
                    {region.alerts.length === 0 && (
                        <p className="muted">{i18n.t('No signals for this region in the selected scope.')}</p>
                    )}
                    <ul>
                        {[...region.alerts].sort((a, b) => comparePeriodIds(a.timePeriod, b.timePeriod)).map(alert => (
                            <li key={alert.id}>
                                <strong>{getPeriodNameFromId(alert.timePeriod)}</strong>
                                <span className="tags">
                                    <LevelTag display={alert.display} />
                                    <ApprovalTag status={approvalOf(alert)} />
                                </span>
                                {alert.approvedAt && (
                                    <span className="muted small">
                                        {i18n.t('Reviewed {{date}}', { date: formatDate(alert.approvedAt) })}
                                        {alert.approvedBy ? ` · ${alert.approvedBy}` : ''}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                    {policy?.levels?.length ? (
                        <details className="policy-levels">
                            <summary>{i18n.t('How levels are raised')}</summary>
                            <p className="muted small">
                                {i18n.t('A level is raised when the forecast probability of exceeding its threshold reaches the stated value.')}
                            </p>
                            <ul>
                                {[...policy.levels].reverse().map(level => (
                                    <li key={level.name} className="small">
                                        <strong>{level.name}</strong>
                                        {' · '}
                                        {i18n.t('{{threshold}}, ≥{{probability}}% chance', {
                                            threshold: describeThreshold(level.thresholdParams),
                                            probability: Math.round(level.exceedanceThreshold * 100),
                                        })}
                                    </li>
                                ))}
                            </ul>
                        </details>
                    ) : null}
                </aside>
            </div>
        </section>
    );
};
