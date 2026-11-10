import { useMemo, useState } from 'react';
import type { DatasetReport } from '../check/checkDataset';
import { createProjection, getBounds, toSvgPath, toSvgPoints } from '../check/mapGeometry';

const WIDTH = 480;
const MAX_LABELS = 12;

/** Lightweight SVG preview of the boundaries: no tiles, so nothing leaves the browser. */
export const BoundaryMap = ({ report }: { report: DatasetReport }) => {
    const [hovered, setHovered] = useState<string>();
    const boundaries = report.boundaries;

    const shapes = useMemo(() => {
        if (!boundaries) return null;
        const bounds = getBounds(boundaries.map(boundary => boundary.geometry));
        if (!bounds) return null;
        const projection = createProjection(bounds, WIDTH);
        const completeness = new Map(report.locationCompleteness.map(item => [item.location, item]));
        return {
            projection,
            items: boundaries.flatMap((boundary, index) => {
                const geometry = boundary.geometry;
                // A geometry without one valid position (e.g. an empty polygon) has nothing to draw.
                const box = geometry && getBounds([geometry]);
                if (!geometry || !box) return [];
                const path = toSvgPath(geometry, projection);
                const points = toSvgPoints(geometry, projection);
                const [labelX, labelY] = projection.project([(box.minX + box.maxX) / 2, (box.minY + box.maxY) / 2]);
                const stats = completeness.get(boundary.name);
                const share = stats?.expected ? Math.round((stats.present / stats.expected) * 100) : null;
                return [{ key: `${boundary.name}-${index}`, name: boundary.name, status: boundary.status, path, points, labelX, labelY, share }];
            }),
        };
    }, [boundaries, report.locationCompleteness]);

    const hoveredItem = shapes?.items.find(item => item.key === hovered);
    const matched = boundaries?.filter(boundary => boundary.status === 'matched').length ?? 0;

    return (
        <section className="panel">
            <h2>Boundaries</h2>
            {!boundaries ? (
                <p className="muted">Add a GeoJSON file to preview the boundaries and match them to CSV locations.</p>
            ) : !shapes ? (
                <p className="muted">The boundaries file has no geometry to draw.</p>
            ) : (
                <>
                    <p className="muted">
                        {matched} of {boundaries.length} boundaries match a CSV location by NAME_1.
                    </p>
                    <div className="map">
                        <svg viewBox={`0 0 ${shapes.projection.width} ${shapes.projection.height}`} role="img" aria-label="Boundary preview">
                            <defs>
                                <pattern id="unmatched" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                                    <rect width="6" height="6" fill="var(--map-unmatched-bg)" />
                                    <line x1="0" y1="0" x2="0" y2="6" stroke="var(--map-unmatched-line)" strokeWidth="2" />
                                </pattern>
                            </defs>
                            {shapes.items.map(item => (
                                <g
                                    key={item.key}
                                    className={`shape shape-${item.status}${hovered === item.key ? ' shape-hover' : ''}`}
                                    onMouseEnter={() => setHovered(item.key)}
                                    onMouseLeave={() => setHovered(undefined)}
                                    onClick={() => setHovered(item.key)}
                                >
                                    <title>{item.status === 'matched' ? `${item.name}: ${item.share ?? 0}% complete` : `${item.name}: no CSV rows`}</title>
                                    {item.path && <path d={item.path} fillRule="evenodd" />}
                                    {item.points.map(([x, y], index) => <circle key={index} cx={x} cy={y} r={5} />)}
                                </g>
                            ))}
                            {shapes.items.length <= MAX_LABELS && shapes.items.map(item => (
                                <text key={item.key} x={item.labelX} y={item.labelY} className="map-label" textAnchor="middle" dominantBaseline="middle">
                                    {item.name}
                                </text>
                            ))}
                        </svg>
                    </div>
                    <p className="map-readout" aria-live="polite">
                        {hoveredItem
                            ? hoveredItem.status === 'matched'
                                ? `${hoveredItem.name} · ${hoveredItem.share ?? 0}% of values present`
                                : `${hoveredItem.name} · no rows in the CSV`
                            : 'Hover or tap an area for details.'}
                    </p>
                    <ul className="legend">
                        <li><span className="swatch swatch-matched" />Matched to CSV rows</li>
                        <li><span className="swatch swatch-unmatched" />Boundary without CSV rows</li>
                    </ul>
                </>
            )}
            {report.locationsWithoutBoundary.length > 0 && (
                <p className="error-text">
                    No boundary for: {report.locationsWithoutBoundary.slice(0, 10).join(', ')}
                    {report.locationsWithoutBoundary.length > 10 && ` and ${report.locationsWithoutBoundary.length - 10} more`}
                </p>
            )}
        </section>
    );
};
