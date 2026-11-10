import { useEffect, useState } from 'react';
import logo from './assets/modeling-icon.svg';
import { ChartsGroup } from './sections/Charts';
import { EvaluationGroup } from './sections/Evaluation';
import { MapsTablesGroup } from './sections/MapsTables';
import { LayoutGroup } from './sections/Layout';
import { ControlsGroup } from './sections/Controls';
import { ClientGroup } from './sections/Client';

type NavGroup = { title: string; items: { id: string; label: string }[] };

const NAV: NavGroup[] = [
    { title: 'Start', items: [{ id: 'overview', label: 'Overview' }] },
    {
        title: 'Forecast charts',
        items: [
            { id: 'uncertainty-area-chart', label: 'UncertaintyAreaChart' },
            { id: 'threshold-chart', label: 'Thresholds & signals' },
            { id: 'threshold-tiles', label: 'Threshold tiles' },
        ],
    },
    {
        title: 'Evaluation',
        items: [
            { id: 'evaluation-data', label: 'evaluationResultToViewData' },
            { id: 'result-plot', label: 'ResultPlot' },
            { id: 'comparison-plot', label: 'ComparisonPlot' },
            { id: 'comparison-plot-list', label: 'ComparisonPlotList' },
            { id: 'split-period-selector', label: 'SplitPeriodSelector' },
            { id: 'comparison-wrapper', label: 'ComparionPlotWrapper' },
        ],
    },
    {
        title: 'Maps & tables',
        items: [
            { id: 'prediction-map', label: 'PredictionMap' },
            { id: 'parse-org-units', label: 'parseOrgUnits' },
            { id: 'prediction-table', label: 'PredictionTable' },
        ],
    },
    {
        title: 'Cards & status',
        items: [
            { id: 'card', label: 'Card' },
            { id: 'widget', label: 'Widget' },
            { id: 'status', label: 'Pill, Tag, Ping, Status' },
            { id: 'overflow-button', label: 'OverflowButton' },
            { id: 'conditional-tooltip', label: 'ConditionalTooltip' },
            { id: 'virtuoso-grid', label: 'VirtuosoGrid' },
        ],
    },
    {
        title: 'Controls',
        items: [
            { id: 'period-picker', label: 'PeriodPicker' },
            { id: 'period-range-field', label: 'PeriodRangeField' },
            { id: 'search-field', label: 'SearchField' },
            { id: 'sidenav', label: 'Sidenav' },
        ],
    },
    {
        title: 'Data & connection',
        items: [
            { id: 'helpers', label: 'View-model helpers' },
            { id: 'chap-client', label: 'createChapClient' },
            { id: 'chap-provider', label: 'ChapProvider' },
            { id: 'host-setup', label: 'Host setup' },
        ],
    },
];

const ENTRYPOINTS = [
    ['@chap-blocks/ui/charts', 'UncertaintyAreaChart, ResultPlot, ComparisonPlot, view-model helpers'],
    ['@chap-blocks/ui/maps', 'PredictionMap, parseOrgUnits, FeatureCollection, BasemapConfig'],
    ['@chap-blocks/ui/tables', 'PredictionTable'],
    ['@chap-blocks/ui/layout', 'Card, Widget, Pill, Tag, Ping, StatusIndicator, OverflowButton, PeriodPicker, PeriodRangeField'],
    ['@chap-blocks/ui/search', 'SearchField (React only)'],
    ['@chap-blocks/ui', 'Everything above plus Sidenav, evaluation lists, threshold and outbreak helpers'],
    ['@chap-blocks/api', 'createChapClient and generated types'],
    ['@chap-blocks/runtime', 'ChapProvider, useChapClient and data hooks'],
];

function useActiveSection() {
    const [active, setActive] = useState(() => window.location.hash.slice(1) || 'overview');
    useEffect(() => {
        const targets = NAV.flatMap(group => group.items)
            .map(({ id }) => document.getElementById(id))
            .filter((target): target is HTMLElement => target !== null);
        const visible = new Map<string, number>();
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
                    else visible.delete(entry.target.id);
                }
                const first = [...visible.entries()].sort((a, b) => a[1] - b[1])[0];
                if (first) setActive(first[0]);
            },
            { rootMargin: '-72px 0px -60% 0px' },
        );
        targets.forEach(target => observer.observe(target));
        return () => observer.disconnect();
    }, []);
    return active;
}

export function App() {
    const active = useActiveSection();
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        // Hash links on first load: the examples render after the browser tried to scroll.
        const id = window.location.hash.slice(1);
        if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
    }, []);

    useEffect(() => {
        document.body.classList.toggle('menu-open', menuOpen);
    }, [menuOpen]);

    return (
        <>
            <header className="app-header">
                <a href="#overview" className="brand">
                    <img src={logo} alt="" className="chap-mark" />
                    <span className="brand-name">Chap</span>
                    <span className="app-title">Blocks gallery</span>
                </a>
                <button
                    type="button"
                    className="menu-toggle"
                    aria-expanded={menuOpen}
                    aria-controls="gallery-nav"
                    onClick={() => setMenuOpen(open => !open)}
                >
                    {menuOpen ? 'Close' : 'Contents'}
                </button>
            </header>
            <div className="layout">
                <nav id="gallery-nav" className={menuOpen ? 'nav nav-open' : 'nav'} aria-label="Blocks">
                    {NAV.map(group => (
                        <div key={group.title} className="nav-group">
                            <p className="nav-title">{group.title}</p>
                            <ul>
                                {group.items.map(item => (
                                    <li key={item.id}>
                                        <a
                                            href={`#${item.id}`}
                                            aria-current={active === item.id ? 'location' : undefined}
                                            onClick={() => setMenuOpen(false)}
                                        >
                                            {item.label}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </nav>
                {menuOpen && <div className="nav-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
                <main className="content">
                    <section className="hero" id="overview">
                        <p className="eyebrow">Chap blocks</p>
                        <h1>Blocks gallery</h1>
                        <p className="lede">
                            Reusable React blocks for Chap: forecast charts, evaluation plots, maps, tables, cards and
                            period controls. Every example here runs in your browser on synthetic data — no Chap server,
                            no DHIS2, and no modeling package.
                        </p>
                        <ul className="facts-inline">
                            <li><strong>Props in, callbacks out.</strong> Blocks never fetch.</li>
                            <li><strong>Pick a subpath.</strong> Import only what you use.</li>
                            <li><strong>Not on npm.</strong> Add this repository as a pinned git submodule; see the README.</li>
                        </ul>
                        <div className="props-wrap">
                            <table className="props entry-table">
                                <thead>
                                    <tr><th scope="col">Import from</th><th scope="col">Contains</th></tr>
                                </thead>
                                <tbody>
                                    {ENTRYPOINTS.map(([path, contents]) => (
                                        <tr key={path}><td><code>{path}</code></td><td>{contents}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                    <ChartsGroup />
                    <EvaluationGroup />
                    <MapsTablesGroup />
                    <LayoutGroup />
                    <ControlsGroup />
                    <ClientGroup />
                    <footer className="footer">
                        <p>
                            Synthetic data only. Blocks extracted from Chap Frontend; see <code>UPSTREAM.md</code> for source
                            attribution and licences. Highcharts retains its own licensing terms.
                        </p>
                    </footer>
                </main>
            </div>
        </>
    );
}
