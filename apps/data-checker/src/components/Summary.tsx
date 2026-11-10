import type { DatasetReport } from '../check/checkDataset';

const PERIOD_TYPE_LABELS = { day: 'Daily', week: 'Weekly', month: 'Monthly', year: 'Yearly' };

export const Summary = ({ report }: { report: DatasetReport }) => {
    const errors = report.issues.filter(issue => issue.severity === 'error').length;
    const warnings = report.issues.length - errors;
    const status = errors ? 'blocked' : warnings ? 'warnings' : 'ready';
    const range = report.periods.length ? `${report.periods[0]} – ${report.periods[report.periods.length - 1]}` : '—';

    return (
        <section className={`panel summary summary-${status}`}>
            <div className="summary-status">
                <span className="status-dot" aria-hidden />
                <div>
                    <h2>{status === 'blocked' ? 'Not ready to import' : status === 'warnings' ? 'Ready, with warnings' : 'Ready to import'}</h2>
                    <p className="muted">
                        {errors} {errors === 1 ? 'error' : 'errors'} · {warnings} {warnings === 1 ? 'warning' : 'warnings'}
                    </p>
                </div>
            </div>
            <dl className="stats">
                <div><dt>Rows</dt><dd>{report.rowCount.toLocaleString()}</dd></div>
                <div><dt>Locations</dt><dd>{report.locations.length}</dd></div>
                <div><dt>Periods</dt><dd>{report.periods.length}</dd></div>
                <div><dt>Period type</dt><dd>{report.periodType ? PERIOD_TYPE_LABELS[report.periodType] : '—'}</dd></div>
                <div className="stat-wide"><dt>Range</dt><dd>{range}</dd></div>
                <div className="stat-wide">
                    <dt>Variables</dt>
                    <dd className="chips">{report.variables.length ? report.variables.map(name => <code key={name}>{name}</code>) : '—'}</dd>
                </div>
            </dl>
        </section>
    );
};
