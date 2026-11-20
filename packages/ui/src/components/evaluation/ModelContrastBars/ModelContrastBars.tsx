import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import type { MetricInfo } from '@chap-blocks/api';
import { formatScore } from '../../../utils/metricFormat';
import { contrastModels, type ModelContrastRow } from './modelContrast';
import styles from './ModelContrastBars.module.css';

export type ModelContrastBarsProps = {
    /** One row per org unit, period or forecast, with both models' scores on the same metric. */
    rows: ModelContrastRow[];
    /** The two models' names, first and second. */
    names: [string, string];
    /** The metric: its name, unit, direction and target decide which score is better. Without it lower is better. */
    metric?: MetricInfo;
    /** Show only the rows where the models differ most. */
    count?: number;
    /** Heading of the row label column. */
    rowLabel?: string;
};

/**
 * Two models compared row by row on one metric: a bar to the right where the first model scores better, to the left
 * where the second does, longest first. Answers where in the country, or when, one model beats the other.
 */
export const ModelContrastBars = ({ rows, names, metric, count, rowLabel = i18n.t('Org unit') }: ModelContrastBarsProps) => {
    const contrast = useMemo(() => contrastModels(rows, metric), [rows, metric]);
    const shown = count === undefined ? contrast.rows : contrast.rows.slice(0, count);
    const max = Math.max(1e-12, ...shown.map(row => Math.abs(row.gap)));
    const format = (value: number) => formatScore(value, metric?.unit);
    const ties = contrast.rows.length - contrast.winsA - contrast.winsB;

    if (!contrast.rows.length) return <p className={styles.empty}>{i18n.t('No rows with scores for both models')}</p>;

    return (
        <div className={styles.contrast}>
            <p className={styles.summary}>
                <span className={styles.a}><strong>{names[0]}</strong> {i18n.t('better in {{count}}', { count: contrast.winsA })}</span>
                <span className={styles.b}><strong>{names[1]}</strong> {i18n.t('better in {{count}}', { count: contrast.winsB })}</span>
                {ties > 0 && <span>{i18n.t('{{count}} tied', { count: ties })}</span>}
                <span className={styles.muted}>{i18n.t('of {{count}}', { count: contrast.rows.length })}</span>
            </p>
            <div className={styles.scroll}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th scope="col">{rowLabel}</th>
                            <th scope="col" className={styles.number}>{names[0]}</th>
                            <th scope="col" className={styles.number}>{names[1]}</th>
                            <th scope="col" className={styles.barCell}>
                                <div className={styles.barHead}>
                                    <span>← {i18n.t('{{name}} better', { name: names[1] })}</span>
                                    <span>{i18n.t('{{name}} better', { name: names[0] })} →</span>
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {shown.map(row => {
                            const width = (Math.abs(row.gap) / max) * 50;
                            return (
                                <tr key={row.id}>
                                    <th scope="row">{row.label}</th>
                                    <td className={`${styles.number} ${row.gap > 0 ? styles.better : ''}`}>{format(row.a!)}</td>
                                    <td className={`${styles.number} ${row.gap < 0 ? styles.better : ''}`}>{format(row.b!)}</td>
                                    <td className={styles.barCell}>
                                        <div className={styles.track}>
                                            <div className={styles.axis} />
                                            {row.gap !== 0 && (
                                                <div
                                                    className={`${styles.bar} ${row.gap > 0 ? styles.barA : styles.barB}`}
                                                    style={{ left: `${row.gap > 0 ? 50 : 50 - width}%`, width: `${width}%` }}
                                                    title={i18n.t('{{name}} better by {{gap}}', { name: row.gap > 0 ? names[0] : names[1], gap: format(Math.abs(row.gap)) })}
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {count !== undefined && contrast.rows.length > count && (
                <p className={styles.muted}>{i18n.t('The {{count}} rows where the models differ most', { count })}</p>
            )}
        </div>
    );
};
