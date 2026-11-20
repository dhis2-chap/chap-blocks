import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { canonicalizePeriodId } from '@chap-blocks/core';
import type { PredictionOrgUnitSeries } from '../../../interfaces/Prediction';
import { buildChartPeriods, buildPeriodIndexLookup, getSeriesPeriods } from '../../../utils/chartPeriods';
import { getPeriodNameFromId } from '../../../utils/Time';
import { niceTicks } from '../../../utils/svgScale';
import { forecastHits } from './forecastHits';
import styles from './ForecastBandsChart.module.css';

export type ForecastLayer = 'samples' | 'outer' | 'mid' | 'median' | 'observed' | 'hits' | 'misses' | 'errors';

export type ForecastBandsChartProps = {
    /** One org unit's forecast; `actualCases` before the first forecast period are drawn as history. */
    series: PredictionOrgUnitSeries;
    /** Which parts to draw. Hidden parts keep their space, so stepping through layers never moves the plot. */
    layers?: Partial<Record<ForecastLayer, boolean>>;
    /** Sample values per forecast period, drawn as dots when the `samples` layer is on. */
    samples?: Record<string, number[]>;
    /** A forecast period to shade, e.g. the one a text talks about. */
    highlightPeriod?: string;
    formatPeriod?: (period: string) => string;
    /** Y-axis label. */
    targetName?: string;
    height?: number;
    /** Hide the legend under the plot. */
    hideLegend?: boolean;
};

const DEFAULT_LAYERS: Record<ForecastLayer, boolean> = {
    samples: false, outer: true, mid: true, median: true, observed: true, hits: false, misses: false, errors: false,
};

const WIDTH = 960;
const MARGIN = { left: 56, right: 16, top: 30, bottom: 34 };
const MAX_X_LABELS = 12;

const polyline = (points: [number, number][]) => points.map(([x, y]) => `${x},${y}`).join(' ');
const band = (top: [number, number][], bottom: [number, number][]) =>
    `M${[...top, ...[...bottom].reverse()].map(([x, y]) => `${x},${y}`).join(' L')} Z`;
const isNumber = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value);
const formatNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 });

/**
 * A forecast drawn in layers: samples, the 80% and 50% bands, the median and what was observed, with optional marks
 * for observed values inside (filled dot) or outside (ring) the 80% band and a stick from the median to each observed
 * value. Meant for explaining a forecast or an evaluation one part at a time.
 */
export const ForecastBandsChart = ({
    series,
    layers,
    samples,
    highlightPeriod,
    formatPeriod = period => getPeriodNameFromId(period, 'short'),
    targetName = i18n.t('Cases'),
    height = 280,
    hideLegend = false,
}: ForecastBandsChartProps) => {
    const show = { ...DEFAULT_LAYERS, ...layers };
    const model = useMemo(() => {
        const periods = buildChartPeriods(getSeriesPeriods(series));
        const indexOf = buildPeriodIndexLookup(periods);
        const observed = new Map(series.actualCases?.map(point => [canonicalizePeriodId(point.period), point.value]) ?? []);
        const forecast = series.points.flatMap(point => {
            const index = indexOf(point.period);
            return index === undefined ? [] : [{ ...point, index, samples: samples?.[point.period] ?? [] }];
        });
        const firstForecast = forecast.length ? Math.min(...forecast.map(point => point.index)) : periods.length;
        const values = [
            ...forecast.flatMap(point => [...Object.values(point.quantiles), ...point.samples]),
            ...Array.from(observed.values()),
        ].filter(isNumber);
        const ticks = niceTicks(Math.max(1, ...values));
        return { periods, observed, forecast, firstForecast, ticks, hits: forecastHits(series) };
    }, [series, samples]);

    const { periods, observed, forecast, firstForecast, ticks, hits } = model;
    const plotWidth = WIDTH - MARGIN.left - MARGIN.right;
    const plotHeight = height - MARGIN.top - MARGIN.bottom;
    const slot = plotWidth / Math.max(1, periods.length);
    const maxY = ticks[ticks.length - 1];
    const xOf = (index: number) => MARGIN.left + (index + 0.5) * slot;
    const yOf = (value: number) => MARGIN.top + plotHeight - (value / maxY) * plotHeight;
    const hidden = (layer: ForecastLayer) => (show[layer] ? '' : styles.hidden);
    const observedAt = (index: number) => observed.get(canonicalizePeriodId(periods[index]));
    const hitByPeriod = new Map(hits.points.map(point => [point.period, point]));

    const history: [number, number][] = periods.slice(0, firstForecast).flatMap((_, index) => {
        const value = observedAt(index);
        return isNumber(value) ? [[xOf(index), yOf(value)] as [number, number]] : [];
    });
    const forecastObserved: [number, number][] = forecast.flatMap(point => {
        const value = observedAt(point.index);
        return isNumber(value) ? [[xOf(point.index), yOf(value)] as [number, number]] : [];
    });
    // Join the forecast's observed line to the last observed value before it, so the two read as one line.
    const joinedObserved = history.length ? [history[history.length - 1], ...forecastObserved] : forecastObserved;
    const quantileLine = (key: keyof (typeof forecast)[number]['quantiles']) =>
        forecast.flatMap(point => (isNumber(point.quantiles[key]) ? [[xOf(point.index), yOf(point.quantiles[key])] as [number, number]] : []));
    const labelEvery = Math.max(1, Math.ceil(periods.length / MAX_X_LABELS));
    const splitX = MARGIN.left + firstForecast * slot;

    if (!forecast.length) return <p className={styles.empty}>{i18n.t('No forecast to show')}</p>;

    return (
        <figure className={styles.figure}>
            <svg className={styles.chart} viewBox={`0 0 ${WIDTH} ${height}`} role="img"
                aria-label={i18n.t('Forecast for {{orgUnit}}: {{hits}} of {{scored}} observed values inside the 80% band', {
                    orgUnit: series.orgUnitName, hits: hits.hits, scored: hits.scored,
                })}>
                {ticks.map(value => (
                    <g key={value}>
                        <line x1={MARGIN.left} x2={WIDTH - MARGIN.right} y1={yOf(value)} y2={yOf(value)} className={styles.grid} />
                        <text x={MARGIN.left - 8} y={yOf(value) + 4} className={styles.tick} textAnchor="end">{formatNumber(value)}</text>
                    </g>
                ))}
                <text x={MARGIN.left - 48} y={MARGIN.top - 14} className={styles.tick}>{targetName}</text>
                {periods.map((period, index) => (index % labelEvery === 0) && (
                    <text key={period} x={xOf(index)} y={MARGIN.top + plotHeight + 22} className={styles.tick} textAnchor="middle">{formatPeriod(period)}</text>
                ))}

                {forecast.map(point => canonicalizePeriodId(point.period) === canonicalizePeriodId(highlightPeriod ?? '') && (
                    <rect key={point.period} x={xOf(point.index) - slot / 2} y={MARGIN.top} width={slot} height={plotHeight} className={styles.highlight} />
                ))}
                <path d={band(quantileLine('quantile_high'), quantileLine('quantile_low'))} className={`${styles.outer} ${hidden('outer')}`} />
                <path d={band(quantileLine('quantile_mid_high'), quantileLine('quantile_mid_low'))} className={`${styles.mid} ${hidden('mid')}`} />
                <polyline points={polyline(quantileLine('median'))} className={`${styles.median} ${hidden('median')}`} />

                {history.length > 0 && (
                    <>
                        <line x1={splitX} x2={splitX} y1={MARGIN.top - 6} y2={MARGIN.top + plotHeight} className={styles.split} />
                        <text x={splitX - 8} y={MARGIN.top - 12} className={styles.label} textAnchor="end">{i18n.t('← observed')}</text>
                        <text x={splitX + 8} y={MARGIN.top - 12} className={styles.label}>{i18n.t('forecast →')}</text>
                    </>
                )}

                <g className={hidden('samples')}>
                    {forecast.map(point => point.samples.map((value, sample) => (
                        <circle key={`${point.period}-${sample}`} cx={xOf(point.index) + (((sample * 7) % 5) - 2) * Math.min(5, slot / 12)} cy={yOf(value)} r={3}
                            className={show.outer && (value < point.quantiles.quantile_low || value > point.quantiles.quantile_high) ? `${styles.sample} ${styles.sampleOutside}` : styles.sample} />
                    )))}
                </g>
                <g className={hidden('errors')}>
                    {forecast.map(point => {
                        const value = observedAt(point.index);
                        return isNumber(value) && isNumber(point.quantiles.median) && (
                            <line key={point.period} x1={xOf(point.index)} x2={xOf(point.index)} y1={yOf(point.quantiles.median)} y2={yOf(value)} className={styles.error} />
                        );
                    })}
                </g>
                <polyline points={polyline(history)} className={styles.observed} />
                <polyline points={polyline(joinedObserved)} className={`${styles.observed} ${hidden('observed')}`} />
                <g className={hidden('hits')}>
                    {forecast.map(point => hitByPeriod.get(point.period)?.inside === true && (
                        <circle key={point.period} cx={xOf(point.index)} cy={yOf(observedAt(point.index)!)} r={6} className={styles.hit} />
                    ))}
                </g>
                <g className={hidden('misses')}>
                    {forecast.map(point => hitByPeriod.get(point.period)?.inside === false && (
                        <circle key={point.period} cx={xOf(point.index)} cy={yOf(observedAt(point.index)!)} r={7} className={styles.miss} />
                    ))}
                </g>

                {forecast.map(point => {
                    const value = observedAt(point.index);
                    const { quantile_low: low, quantile_high: high, median } = point.quantiles;
                    return (
                        <rect key={point.period} x={xOf(point.index) - slot / 2} y={MARGIN.top} width={slot} height={plotHeight} className={styles.hover}>
                            <title>
                                {`${formatPeriod(point.period)}: ${i18n.t('median')} ${formatNumber(median)}, ${i18n.t('80% band')} ${formatNumber(low)}–${formatNumber(high)}`}
                                {isNumber(value) ? `, ${i18n.t('observed')} ${formatNumber(value)}` : ''}
                            </title>
                        </rect>
                    );
                })}
            </svg>
            {!hideLegend && (
                <figcaption className={styles.legend}>
                    {show.observed && <span><i className={`${styles.key} ${styles.keyObserved}`} />{i18n.t('Observed')}</span>}
                    {show.median && <span><i className={`${styles.key} ${styles.keyMedian}`} />{i18n.t('Median')}</span>}
                    {show.mid && <span><i className={`${styles.key} ${styles.keyMid}`} />{i18n.t('50% band')}</span>}
                    {show.outer && <span><i className={`${styles.key} ${styles.keyOuter}`} />{i18n.t('80% band')}</span>}
                    {show.samples && <span><i className={`${styles.key} ${styles.keySample}`} />{i18n.t('Samples')}</span>}
                    {show.hits && <span><i className={`${styles.key} ${styles.keyHit}`} />{i18n.t('Inside the 80% band')}</span>}
                    {show.misses && <span><i className={`${styles.key} ${styles.keyMiss}`} />{i18n.t('Outside the 80% band')}</span>}
                    {show.errors && <span><i className={`${styles.key} ${styles.keyError}`} />{i18n.t('Error (median to observed)')}</span>}
                </figcaption>
            )}
        </figure>
    );
};
