import { InputCompletenessView } from '@chap-blocks/modeling/datasets';
import type { DatasetReport } from '../check/checkDataset';

const percent = (present: number, expected: number) => (expected ? (present / expected) * 100 : 0);

const Bar = ({ value }: { value: number }) => (
    <span className="bar" aria-hidden>
        <span className={`bar-fill${value < 100 ? ' bar-partial' : ''}`} style={{ width: `${value}%` }} />
    </span>
);

export const Completeness = ({ report }: { report: DatasetReport }) => {
    if (!report.variables.length || !report.periods.length || !report.locations.length) {
        return (
            <section className="panel">
                <h2>Completeness</h2>
                <p className="muted">Completeness appears once the CSV has readable periods, locations and numeric columns.</p>
            </section>
        );
    }

    return (
        <section className="panel">
            <h2>Completeness</h2>
            <p className="muted">
                Values present out of {report.periods.length} periods × {report.locations.length} locations for each variable.
            </p>
            <table className="completeness-table">
                <thead>
                    <tr>
                        <th scope="col">Variable</th>
                        <th scope="col">Present</th>
                        <th scope="col" className="hide-narrow">Zeros</th>
                        <th scope="col" className="bar-cell"><span className="visually-hidden">Share</span></th>
                    </tr>
                </thead>
                <tbody>
                    {report.variableCompleteness.map((item) => {
                        const value = percent(item.present, item.expected);
                        return (
                            <tr key={item.variable}>
                                <th scope="row"><code>{item.variable}</code></th>
                                <td>
                                    {value.toFixed(value === 100 ? 0 : 1)}%
                                    <span className="muted small"> ({item.present.toLocaleString()} of {item.expected.toLocaleString()})</span>
                                </td>
                                <td className="hide-narrow">{item.zeros.toLocaleString()}</td>
                                <td className="bar-cell"><Bar value={value} /></td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            <div className="completeness-view">
                <InputCompletenessView
                    observations={report.observations}
                    periods={report.periods}
                    orgUnits={report.locations}
                    variables={report.variables}
                />
            </div>
        </section>
    );
};
