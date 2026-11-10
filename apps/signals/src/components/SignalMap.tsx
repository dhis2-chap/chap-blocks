import { useMemo } from 'react';
import i18n from '@dhis2/d2-i18n';
import { NO_SIGNAL_DISPLAY } from '../alertDisplay';
import { projectBoundaries, type Boundary } from '../geometry';
import type { LevelCount, RegionSignal } from '../signals';

const WIDTH = 600;

type Props = {
    boundaries: Boundary[];
    regions: RegionSignal[];
    levels: LevelCount[];
    selectedId?: string;
    onSelect: (orgUnitId: string) => void;
};

/** A static choropleth of each region's highest signal level. */
export const SignalMap = ({ boundaries, regions, levels, selectedId, onSelect }: Props) => {
    const { height, paths } = useMemo(() => projectBoundaries(boundaries, WIDTH), [boundaries]);
    const byId = useMemo(() => new Map(regions.map(region => [region.orgUnitId, region])), [regions]);
    const drawn = boundaries.filter(boundary => byId.has(boundary.id) && paths.get(boundary.id));
    const missing = regions.filter(region => !paths.get(region.orgUnitId));
    // Draw the selected region last so its outline is not covered by neighbours.
    const ordered = [...drawn].sort((a, b) => Number(a.id === selectedId) - Number(b.id === selectedId));

    if (!drawn.length) {
        return <p className="muted">{i18n.t('The forecast dataset has no map boundaries for these regions.')}</p>;
    }
    return (
        <figure className="signal-map">
            <svg viewBox={`-4 -4 ${WIDTH + 8} ${height + 8}`} role="group" aria-label={i18n.t('Map of regions by signal level')}>
                {ordered.map((boundary) => {
                    const region = byId.get(boundary.id)!;
                    const display = region.top?.display ?? NO_SIGNAL_DISPLAY;
                    const label = `${region.name}: ${region.top ? display.label : NO_SIGNAL_DISPLAY.label}`;
                    return (
                        <path
                            key={boundary.id}
                            d={paths.get(boundary.id)}
                            className={boundary.id === selectedId ? 'region selected' : 'region'}
                            style={{ fill: display.color }}
                            role="button"
                            tabIndex={0}
                            aria-label={label}
                            aria-pressed={boundary.id === selectedId}
                            onClick={() => onSelect(boundary.id)}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    onSelect(boundary.id);
                                }
                            }}
                        >
                            <title>{label}</title>
                        </path>
                    );
                })}
            </svg>
            <figcaption className="legend">
                {levels.map(level => (
                    <span key={level.level} className="legend-item">
                        <span className="legend-swatch" style={{ background: level.display.color }} />
                        {level.display.label}
                    </span>
                ))}
                <span className="legend-item">
                    <span className="legend-swatch" style={{ background: NO_SIGNAL_DISPLAY.color }} />
                    {NO_SIGNAL_DISPLAY.label}
                </span>
            </figcaption>
            {missing.length > 0 && (
                <p className="muted small">
                    {i18n.t('No boundary for: {{regions}}', { regions: missing.map(region => region.name).join(', ') })}
                </p>
            )}
        </figure>
    );
};
