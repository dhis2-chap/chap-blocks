import { sortPeriods } from '../signals';
import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { Checkbox, CircularLoader, NoticeBox } from '@dhis2/ui';
import { AlertApproval, type PredictionSetupReadWithPredictions } from '@chap-blocks/api';
import { getPeriodNameFromId } from '@chap-blocks/ui';
import { canonicalizePeriodId } from '@chap-blocks/core';
import {
    describeError,
    useAlertPolicies,
    useAlertPolicyDisplays,
    useBoundaries,
    usePredictionAlerts,
    usePredictionSeries,
} from '../queries';
import { approvalOf, buildRegionSignals, displayAlerts, latestPrediction, levelSummary } from '../signals';
import type { ViewState } from '../useHashState';
import { SignalMap } from './SignalMap';
import { RegionTable } from './RegionTable';
import { RegionDetail } from './RegionDetail';

type Props = {
    setup: PredictionSetupReadWithPredictions;
    view: ViewState;
    onChange: (patch: Partial<ViewState>, options?: { replace?: boolean }) => void;
};

const humanize = (value: string) => {
    const words = value.replace(/[_-]+/g, ' ').trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
};

const formatDateTime = (value: string) =>
    new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const Loading = ({ label }: { label: string }) => (
    <div className="center" role="status"><CircularLoader small /><span className="muted">{label}</span></div>
);

export const Dashboard = ({ setup, view, onChange }: Props) => {
    const prediction = latestPrediction(setup.predictions);
    const alerts = usePredictionAlerts(prediction?.id);
    const policies = useAlertPolicies();
    const policyIds = useMemo(() => [...new Set([
        ...alerts.data?.map(alert => alert.alertPolicyId) ?? [],
        ...prediction?.alertPolicyId != null ? [prediction.alertPolicyId] : [],
    ])].sort((a, b) => a - b), [alerts.data, prediction]);
    const displays = useAlertPolicyDisplays(policyIds);
    const boundaries = useBoundaries(prediction?.datasetId);
    const names = boundaries.data?.names ?? EMPTY_NAMES;
    const forecast = usePredictionSeries(prediction, names);

    // A run records its policy from Chap 2.6. Otherwise use the policy its alerts name, as the
    // modeling package does, and finally the setup's current policy.
    const policyId = prediction?.alertPolicyId ?? alerts.data?.[0]?.alertPolicyId ?? setup.alertPolicy?.id;
    const policy = policies.data?.find(item => item.id === policyId) ?? setup.alertPolicy ?? undefined;
    const displayed = useMemo(
        () => displayAlerts(alerts.data ?? [], policies.data ?? (policy ? [policy] : []), displays.data ?? {}),
        [alerts.data, policies.data, policy, displays.data],
    );
    const periods = useMemo(() => {
        const byCanonical = new Map<string, string>();
        [...forecast.series.flatMap(series => series.points.map(point => point.period)), ...displayed.map(alert => alert.timePeriod)]
            .forEach(period => byCanonical.has(canonicalizePeriodId(period)) || byCanonical.set(canonicalizePeriodId(period), period));
        return sortPeriods([...byCanonical.values()]);
    }, [forecast.series, displayed]);
    const orgUnitIds = prediction?.orgUnits?.length ? prediction.orgUnits : setup.orgUnits;
    const regions = useMemo(() => buildRegionSignals({
        orgUnitIds,
        names,
        alerts: displayed,
        period: view.period,
        approvedOnly: view.approvedOnly,
    }), [orgUnitIds, names, displayed, view.period, view.approvedOnly]);
    const levels = useMemo(
        () => levelSummary(regions, policy, policy ? displays.data?.[policy.id] : undefined),
        [regions, policy, displays.data],
    );
    // Without a region in the link, show the highest-ranked one.
    const selected = regions.find(region => region.orgUnitId === view.region) ?? regions[0];
    const selectRegion = (region: string) => {
        onChange({ region });
        // On stacked layouts the chart sits below the list, so bring it into view.
        if (window.matchMedia('(max-width: 960px)').matches) {
            requestAnimationFrame(() => document.getElementById('region-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
        }
    };
    const signalled = regions.filter(region => region.top).length;
    const pending = displayed.filter(alert => approvalOf(alert) === AlertApproval.PENDING).length;
    const targetName = humanize(setup.configuredModel.modelTemplate.target ?? 'disease_cases');

    if (!prediction) {
        return (
            <NoticeBox title={i18n.t('No forecasts yet')}>
                {i18n.t('“{{setup}}” has not produced a prediction run yet. Signals appear here after its first run.', { setup: setup.name })}
            </NoticeBox>
        );
    }

    const runError = alerts.error ?? policies.error ?? boundaries.error;
    return (
        <>
            <section className="run-meta" aria-label={i18n.t('Latest run')}>
                <dl>
                    <div><dt>{i18n.t('Latest run')}</dt><dd>{formatDateTime(prediction.created)}</dd></div>
                    <div>
                        <dt>{i18n.t('Forecast periods')}</dt>
                        <dd>
                            {periods.length
                                ? `${getPeriodNameFromId(periods[0], 'short')} – ${getPeriodNameFromId(periods[periods.length - 1], 'short')}`
                                : i18n.t('{{count}} periods', { count: prediction.nPeriods })}
                        </dd>
                    </div>
                    <div>
                        <dt>{i18n.t('Model')}</dt>
                        <dd>{setup.configuredModel.modelTemplate.displayName ?? setup.configuredModel.name}</dd>
                    </div>
                    <div><dt>{i18n.t('Alert policy')}</dt><dd>{policy?.name ?? i18n.t('None')}</dd></div>
                </dl>
            </section>

            {runError != null && (
                <NoticeBox error title={i18n.t('Some signal data could not be loaded')}>{describeError(runError)}</NoticeBox>
            )}
            {policyId == null && !displayed.length && (
                <NoticeBox title={i18n.t('This setup does not raise signals')}>
                    {i18n.t('No alert policy is attached, so forecasts are shown without signal levels.')}
                </NoticeBox>
            )}

            {alerts.isLoading ? <Loading label={i18n.t('Loading signals…')} /> : (
                <>
                    <section className="summary" aria-label={i18n.t('Signal summary')}>
                        <div className="stat">
                            <span className="stat-value">{signalled}<span className="stat-of"> / {regions.length}</span></span>
                            <span className="stat-label">{i18n.t('regions with signals')}</span>
                        </div>
                        {levels.map(level => (
                            <div className="stat" key={level.level} style={{ borderTopColor: level.display.color }}>
                                <span className="stat-value">{level.regions}</span>
                                <span className="stat-label">{level.display.label}</span>
                            </div>
                        ))}
                        <div className="stat">
                            <span className="stat-value">{pending}</span>
                            <span className="stat-label">{i18n.t('signals awaiting approval')}</span>
                        </div>
                    </section>

                    {policyId != null && !displayed.length && (
                        <NoticeBox valid title={i18n.t('No signals in the latest forecast')}>
                            {i18n.t('No region reached a level of “{{policy}}” in this run.', { policy: policy?.name ?? '' })}
                        </NoticeBox>
                    )}

                    <div className="filters" role="group" aria-label={i18n.t('Filters')}>
                        <div className="segmented" role="radiogroup" aria-label={i18n.t('Forecast period')}>
                            {[undefined, ...periods].map(period => (
                                <button
                                    key={period ?? 'all'}
                                    type="button"
                                    role="radio"
                                    aria-checked={view.period === period}
                                    onClick={() => onChange({ period })}
                                >
                                    {period ? getPeriodNameFromId(period, 'short') : i18n.t('All periods')}
                                </button>
                            ))}
                        </div>
                        <Checkbox
                            dense
                            label={i18n.t('Approved signals only')}
                            checked={view.approvedOnly}
                            onChange={({ checked }) => onChange({ approvedOnly: checked })}
                        />
                    </div>
                    {view.approvedOnly && displayed.length > 0 && !signalled && (
                        <p className="muted">{i18n.t('No signals have been approved in this scope yet.')}</p>
                    )}

                    <div className="overview">
                        <section className="card" aria-labelledby="map-title">
                            <header className="card-header"><h2 id="map-title">{i18n.t('Signal map')}</h2></header>
                            {boundaries.isLoading ? <Loading label={i18n.t('Loading boundaries…')} /> : (
                                <SignalMap
                                    boundaries={boundaries.data?.regions ?? []}
                                    regions={regions}
                                    levels={levels}
                                    selectedId={selected?.orgUnitId}
                                    onSelect={selectRegion}
                                />
                            )}
                        </section>
                        <section className="card" aria-labelledby="ranking-title">
                            <header className="card-header">
                                <h2 id="ranking-title">{i18n.t('Regions by signal level')}</h2>
                            </header>
                            <RegionTable regions={regions} selectedId={selected?.orgUnitId} onSelect={selectRegion} />
                        </section>
                    </div>

                    {selected && (
                        <RegionDetail
                            key={selected.orgUnitId}
                            region={selected}
                            series={forecast.series.find(series => series.orgUnitId === selected.orgUnitId)}
                            seriesLoading={forecast.isLoading}
                            seriesError={forecast.error}
                            datasetId={prediction.datasetId}
                            policy={policy}
                            targetName={targetName}
                        />
                    )}
                </>
            )}
        </>
    );
};

const EMPTY_NAMES = new Map<string, string>();
