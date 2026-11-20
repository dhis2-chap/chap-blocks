import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { rankOrder, topOverlap, type RankedItem } from './rankOrder';
import styles from './RankingSlopeChart.module.css';

export type RankingSlopeChartProps = {
    /** One item per org unit: what was forecast and what was observed for the same period. */
    items: RankedItem[];
    formatValue?: (value: number) => string;
    /** Mark the top N on both sides and count how many of the forecast's top N really were in the top N. */
    top?: number;
    forecastLabel?: string;
    observedLabel?: string;
};

const WIDTH = 640;
const ROW = 26;
const TOP = 26;
const SIDE = 230;

const defaultFormat = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 1 });

/**
 * Org units in forecast order on the left and in observed order on the right, one line per org unit. Flat lines mean
 * the forecast put that org unit in the right place; steep lines show where the ranking went wrong.
 */
export const RankingSlopeChart = ({
    items,
    formatValue = defaultFormat,
    top,
    forecastLabel = i18n.t('Forecast order'),
    observedLabel = i18n.t('Observed order'),
}: RankingSlopeChartProps) => {
    const placements = useMemo(() => rankOrder(items), [items]);
    if (placements.length < 2) return <p className={styles.empty}>{i18n.t('A ranking needs at least two org units')}</p>;

    const height = TOP + placements.length * ROW + 4;
    const yOf = (rank: number) => TOP + rank * ROW + ROW / 2;
    const xLeft = SIDE;
    const xRight = WIDTH - SIDE;
    const byObserved = [...placements].sort((a, b) => a.observedRank - b.observedRank);
    const inTop = (rank: number) => top !== undefined && rank < top;
    const lineClass = (moved: number) => (moved === 0 ? styles.same : moved === 1 ? styles.near : styles.far);

    return (
        <figure className={styles.figure}>
            <svg className={styles.chart} viewBox={`0 0 ${WIDTH} ${height}`} role="img"
                aria-label={i18n.t('{{count}} org units in forecast order and in observed order', { count: placements.length })}>
                {top !== undefined && top < placements.length && (
                    <line x1={0} x2={WIDTH} y1={TOP + top * ROW} y2={TOP + top * ROW} className={styles.cutoff} />
                )}
                <text x={xLeft} y={14} className={styles.head} textAnchor="end">{forecastLabel}</text>
                <text x={xRight} y={14} className={styles.head}>{observedLabel}</text>
                {placements.map(item => (
                    <g key={item.id}>
                        <line x1={xLeft + 8} x2={xRight - 8} y1={yOf(item.forecastRank)} y2={yOf(item.observedRank)}
                            className={`${styles.line} ${lineClass(Math.abs(item.observedRank - item.forecastRank))}`} />
                        <text x={xLeft} y={yOf(item.forecastRank) + 4} textAnchor="end"
                            className={`${styles.label} ${inTop(item.forecastRank) ? styles.top : ''}`}>
                            <title>{`${item.label}: ${i18n.t('forecast')} ${formatValue(item.forecast)}, ${i18n.t('observed')} ${formatValue(item.observed)}`}</title>
                            {item.forecastRank + 1}. {item.label} <tspan className={styles.value}>{formatValue(item.forecast)}</tspan>
                        </text>
                    </g>
                ))}
                {byObserved.map(item => (
                    <text key={item.id} x={xRight} y={yOf(item.observedRank) + 4}
                        className={`${styles.label} ${inTop(item.observedRank) ? styles.top : ''}`}>
                        <title>{`${item.label}: ${i18n.t('forecast')} ${formatValue(item.forecast)}, ${i18n.t('observed')} ${formatValue(item.observed)}`}</title>
                        {item.observedRank + 1}. {item.label} <tspan className={styles.value}>{formatValue(item.observed)}</tspan>
                    </text>
                ))}
            </svg>
            {top !== undefined && (
                <figcaption className={styles.caption}>
                    {i18n.t('{{hits}} of the forecast top {{top}} were in the observed top {{top}}', {
                        hits: topOverlap(placements, top), top,
                    })}
                </figcaption>
            )}
        </figure>
    );
};
