import i18n from '@dhis2/d2-i18n';
import type { AlertPolicyRead } from '@chap-blocks/api';

/*
 * Level names and colours follow packages/modeling/src/components/BackendAlerts/alertLevelDisplay.ts.
 * The modeling package does not export these helpers, so the rules are mirrored here:
 * a level uses its saved colour when one exists, otherwise the most severe level is red,
 * the least severe is yellow (when there are more than two) and the rest are orange.
 */
export const ALERT_COLORS = {
    green: { color: '#43a047', background: '#e3f3e7' },
    yellow: { color: '#ffc107', background: '#fff4c2' },
    orange: { color: '#fb8c00', background: '#ffead5' },
    red: { color: '#e53935', background: '#fce2e2' },
} as const;

export type AlertColor = keyof typeof ALERT_COLORS | `#${string}`;
export type AlertPolicyDisplay = Record<string, { color: AlertColor }>;
export type LevelDisplay = { label: string; color: string; background: string };

const isPreset = (value: string): value is keyof typeof ALERT_COLORS => value in ALERT_COLORS;

export const resolveAlertColor = (value: AlertColor) =>
    isPreset(value) ? ALERT_COLORS[value] : { color: value, background: `${value}26` };

/** Accepts only the shape the modeling app saves; anything else falls back to the default rule. */
export const parseAlertPolicyDisplay = (value: unknown): AlertPolicyDisplay => {
    if (!value || typeof value !== 'object') return {};
    const result: AlertPolicyDisplay = {};
    for (const [level, entry] of Object.entries(value)) {
        const color = (entry as { color?: unknown })?.color;
        if (typeof color === 'string' && (isPreset(color) || /^#[0-9a-f]{6}$/i.test(color))) {
            result[level] = { color: color as AlertColor };
        }
    }
    return result;
};

export const getLevelDisplay = (
    levelName: string,
    policy?: AlertPolicyRead,
    display?: AlertPolicyDisplay,
): LevelDisplay => {
    if (display && Object.prototype.hasOwnProperty.call(display, levelName)) {
        return { label: levelName, ...resolveAlertColor(display[levelName].color) };
    }
    const levels = policy?.levels ?? [];
    const index = levels.findIndex(level => level.name === levelName);
    const preset: keyof typeof ALERT_COLORS = index === levels.length - 1 && index >= 0
        ? 'red'
        : index === 0 && levels.length > 2 ? 'yellow' : 'orange';
    return { label: levelName, ...ALERT_COLORS[preset] };
};

export const NO_SIGNAL_DISPLAY: LevelDisplay = {
    label: i18n.t('No signal'),
    color: '#dfe5eb',
    background: '#f3f5f7',
};
