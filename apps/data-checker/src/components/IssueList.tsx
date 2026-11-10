import { NoticeBox } from '@dhis2/ui';
import type { Issue } from '../check/checkDataset';

export const IssueList = ({ issues }: { issues: Issue[] }) => {
    const errors = issues.filter(issue => issue.severity === 'error').length;
    const warnings = issues.length - errors;

    return (
        <section className="panel">
            <h2>Issues</h2>
            {issues.length === 0 ? (
                <NoticeBox valid title="No issues found">
                    The files have the columns, periods and boundaries Chap needs.
                </NoticeBox>
            ) : (
                <>
                    <p className="muted">
                        {errors > 0 && `${errors} ${errors === 1 ? 'error' : 'errors'} must be fixed before import. `}
                        {warnings > 0 && `${warnings} ${warnings === 1 ? 'warning' : 'warnings'} may limit which models can use the data.`}
                    </p>
                    <ul className="issues">
                        {issues.map(issue => (
                            <li key={issue.id} className={`issue issue-${issue.severity}`}>
                                <span className="issue-badge">{issue.severity === 'error' ? 'Error' : 'Warning'}</span>
                                <div className="issue-body">
                                    <strong>{issue.title}</strong>
                                    {issue.detail && <p>{issue.detail}</p>}
                                    {issue.examples && issue.examples.length > 0 && (
                                        <ul className="examples">
                                            {issue.examples.map(example => <li key={example}>{example}</li>)}
                                        </ul>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
};
