import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useChapClient, useDataEngine } from '@chap-blocks/runtime';
import { ApiError, type AlertLevel, type AlertPolicyRead, type PredictionInfo } from '@chap-blocks/api';
import { getLastNPeriods, PERIOD_TYPES } from '@chap-blocks/core';
import {
    buildEndemicThresholdMap,
    buildPredictionSeries,
    getThresholdLineRoles,
    type PredictionOrgUnitSeries,
    type ThresholdChartLine,
} from '@chap-blocks/ui';
import { parseAlertPolicyDisplay, type AlertPolicyDisplay } from './alertDisplay';
import { parseBoundaries } from './geometry';

const FIVE_MINUTES = 5 * 60 * 1000;
const QUANTILES = [0.1, 0.25, 0.5, 0.75, 0.9];
const HISTORY_PERIODS: Record<string, number> = { DAY: 365, WEEK: 52 * 2, MONTH: 12 * 2 };

export const describeError = (error: unknown) => {
    if (error instanceof ApiError) {
        const detail = typeof error.body?.detail === 'string' ? error.body.detail : undefined;
        if (error.status === 401 || error.status === 403) return 'The Chap server refused the request. Check the server access token.';
        return detail ? `${detail} (HTTP ${error.status})` : `Chap returned HTTP ${error.status} ${error.statusText}`.trim();
    }
    if (error instanceof TypeError) return 'Could not reach the Chap server.';
    return error instanceof Error ? error.message : 'Unexpected error.';
};

export const usePredictionSetups = () => {
    const client = useChapClient();
    return useQuery({
        queryKey: ['prediction-setups'],
        queryFn: () => client.predictionSetups.listPredictionSetupsV1CrudPredictionSetupsGet(),
        staleTime: FIVE_MINUTES,
    });
};

export const usePredictionSetup = (setupId: number | undefined) => {
    const client = useChapClient();
    return useQuery({
        queryKey: ['prediction-setup', setupId],
        queryFn: () => client.predictionSetups.getPredictionSetupV1CrudPredictionSetupsPredictionSetupIdGet(setupId!),
        enabled: setupId !== undefined,
        staleTime: FIVE_MINUTES,
    });
};

export const useAlertPolicies = () => {
    const client = useChapClient();
    return useQuery({
        queryKey: ['alert-policies'],
        queryFn: () => client.alertPolicies.listAlertPoliciesV1CrudAlertPoliciesGet(),
        staleTime: FIVE_MINUTES,
    });
};

export const usePredictionAlerts = (predictionId: number | undefined) => {
    const client = useChapClient();
    return useQuery({
        queryKey: ['prediction-alerts', predictionId],
        queryFn: () => client.alerts.listAlertsV1CrudAlertsGet(undefined, predictionId),
        enabled: predictionId !== undefined,
        staleTime: FIVE_MINUTES,
    });
};

/**
 * Level colours saved by the modeling app live in the runtime's settings store
 * (browser storage scoped to the Chap server). Missing colours use the default rule.
 */
export const useAlertPolicyDisplays = (policyIds: number[]) => {
    const engine = useDataEngine();
    return useQuery({
        queryKey: ['alert-policy-display', policyIds],
        queryFn: async () => Object.fromEntries(await Promise.all(policyIds.map(async (policyId) => {
            try {
                const result = await engine.query({ display: { resource: `dataStore/modeling/alert-policy-display-${policyId}` } });
                return [policyId, parseAlertPolicyDisplay(result.display)] as const;
            } catch {
                return [policyId, {}] as const;
            }
        }))) as Record<number, AlertPolicyDisplay>,
        staleTime: Infinity,
    });
};

/** Region boundaries and names come from the dataset the run forecast from. */
export const useBoundaries = (datasetId: number | undefined) => {
    const client = useChapClient();
    return useQuery({
        queryKey: ['dataset-boundaries', datasetId],
        queryFn: async () => parseBoundaries(
            (await client.datasets.getDatasetV1CrudDatasetsDatasetIdGet(datasetId!)).geojson,
        ),
        enabled: datasetId !== undefined,
        staleTime: Infinity,
    });
};

export const usePredictionSeries = (prediction: PredictionInfo | undefined, names: Map<string, string>) => {
    const client = useChapClient();
    const entries = useQuery({
        queryKey: ['prediction-entries', prediction?.id, QUANTILES],
        queryFn: () => client.predictions.getPredictionEntriesV1AnalyticsPredictionEntryPredictionIdGet(prediction!.id, QUANTILES),
        enabled: !!prediction,
        staleTime: FIVE_MINUTES,
    });
    const periodType = (prediction?.dataset.periodType ?? '').toUpperCase();
    const history = useMemo(() => {
        const lastPeriod = prediction?.dataset.lastPeriod;
        const count = HISTORY_PERIODS[periodType];
        return lastPeriod && count
            ? new Set(getLastNPeriods(lastPeriod, periodType as keyof typeof PERIOD_TYPES, count))
            : undefined;
    }, [prediction, periodType]);
    const actualCases = useQuery({
        queryKey: ['actual-cases', prediction?.datasetId],
        queryFn: () => client.backtests.getActualCasesV1AnalyticsActualCasesBacktestIdGet(prediction!.datasetId, undefined, true),
        enabled: !!prediction,
        staleTime: FIVE_MINUTES,
    });
    const series = useMemo<PredictionOrgUnitSeries[]>(() => {
        if (!entries.data?.length) return [];
        const observed = actualCases.data?.data?.filter(item => !history || history.has(item.pe));
        const byId = new Map([...names].map(([id, displayName]) => [id, { displayName }]));
        return buildPredictionSeries(
            entries.data,
            byId,
            actualCases.data?.featureId ?? '',
            observed,
            periodType in PERIOD_TYPES ? periodType as keyof typeof PERIOD_TYPES : undefined,
        );
    }, [entries.data, actualCases.data, names, history, periodType]);
    return {
        series,
        isLoading: entries.isLoading,
        error: entries.error,
        // Observed cases are context only; the forecast still renders without them.
        actualCasesError: actualCases.error,
    };
};

/** One dashed line per distinct threshold of the policy, as the modeling prediction page draws them. */
export const usePolicyThresholdLines = (
    datasetId: number | undefined,
    series: PredictionOrgUnitSeries | undefined,
    policy: AlertPolicyRead | undefined,
) => {
    const client = useChapClient();
    const paramsList = useMemo(() => {
        const byKey = new Map<string, AlertLevel['thresholdParams']>();
        policy?.levels?.forEach(level => byKey.set(JSON.stringify(level.thresholdParams), level.thresholdParams));
        return [...byKey.values()];
    }, [policy]);
    const periodIds = useMemo(() => [...new Set([
        ...series?.actualCases?.map(item => item.period) ?? [],
        ...series?.points.map(point => point.period) ?? [],
    ])], [series]);
    const location = series?.orgUnitId;
    return useQuery<ThresholdChartLine[]>({
        queryKey: ['policy-thresholds', datasetId, location, periodIds, paramsList],
        queryFn: () => Promise.all(paramsList.map(async (params) => {
            const response = await client.datasets.computeThresholdsV1AnalyticsThresholdsPost({
                datasetId: datasetId!, periodIds, locations: [location!], params,
            });
            const points = buildEndemicThresholdMap(response.entries, getThresholdLineRoles(response.lines)).get(location!) ?? [];
            return { label: describeThreshold(params), points };
        })),
        enabled: datasetId !== undefined && !!location && periodIds.length > 0 && paramsList.length > 0,
        staleTime: Infinity,
    });
};

const single = (value?: number | number[] | null) => (Array.isArray(value) ? value[0] : value ?? undefined);

// Wording follows packages/modeling/src/components/BackendAlerts/describeAlertLevel.ts.
export const describeThreshold = (params: AlertLevel['thresholdParams']) => {
    if ('quantile' in params) {
        const percentile = Math.round((single(params.quantile) ?? 0) * 100);
        return params.baselineYears == null
            ? `${percentile}th percentile, all history`
            : `${percentile}th percentile, ${params.baselineYears}-year baseline`;
    }
    return `Seasonal mean + ${single('stdMultiplier' in params ? params.stdMultiplier : undefined) ?? '?'} SD`;
};
