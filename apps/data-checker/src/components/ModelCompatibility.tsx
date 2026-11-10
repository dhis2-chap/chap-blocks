import { useQuery } from '@tanstack/react-query';
import { CircularLoader, NoticeBox } from '@dhis2/ui';
import { useChapClient } from '@chap-blocks/runtime';
import type { ModelSpecRead } from '@chap-blocks/api';
import { getModelSupport } from '@chap-blocks/modeling/datasets';
import type { DatasetReport } from '../check/checkDataset';

const modelName = (model: ModelSpecRead) => model.displayName || model.name;

const PERIOD_TYPE_LABELS: Record<string, string> = { week: 'weekly', month: 'monthly', year: 'yearly', day: 'daily' };

/** Which configured Chap models could run on the dataset: its columns and period type. Reads models only. */
export const ModelCompatibility = ({ report }: { report: DatasetReport }) => {
    const client = useChapClient();
    const { data: models, error, isLoading } = useQuery({
        queryKey: ['models'],
        queryFn: () => client.models.listConfiguredModelsV1CrudConfiguredModelsGet(),
        staleTime: 30_000,
    });

    if (isLoading) {
        return (
            <section className="panel">
                <h2>Model compatibility</h2>
                <CircularLoader small />
            </section>
        );
    }
    if (error || !models) {
        return (
            <section className="panel">
                <h2>Model compatibility</h2>
                <NoticeBox warning title="Could not load models from Chap">
                    The file checks above do not need Chap. Connect a Chap server to see which models can use this dataset.
                </NoticeBox>
            </section>
        );
    }

    const support = getModelSupport(report.variables, report.periodType ?? '', models);
    const total = support.supported.length + support.missingColumns.length + support.wrongPeriodType.length;

    return (
        <section className="panel">
            <h2>Model compatibility</h2>
            <p className="summary-line">
                <strong className="big-number">{support.supported.length}</strong> of {total} configured models can use this dataset
            </p>
            <div className="bar bar-large" role="meter" aria-valuemin={0} aria-valuemax={total} aria-valuenow={support.supported.length} aria-label="Supported models">
                <span className="bar-fill" style={{ width: `${total ? (support.supported.length / total) * 100 : 0}%` }} />
            </div>
            {support.nextColumns.length > 0 && (
                <div className="group">
                    <h3>Add columns to support more models</h3>
                    <ul className="plain-list">
                        {support.nextColumns.map(({ columns, models: unlocked }) => (
                            <li key={columns.join()}>
                                <span className="gain">+{unlocked.length}</span>
                                {columns.map(name => <code key={name}>{name}</code>)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            {support.supported.length > 0 && (
                <details className="group" open={support.supported.length <= 6}>
                    <summary>Supported ({support.supported.length})</summary>
                    <ul className="model-list">
                        {support.supported.map(model => (
                            <li key={model.id}><span className="dot dot-ok" aria-hidden />{modelName(model)}</li>
                        ))}
                    </ul>
                </details>
            )}
            {(support.missingColumns.length > 0 || support.wrongPeriodType.length > 0) && (
                <details className="group">
                    <summary>Not supported ({support.missingColumns.length + support.wrongPeriodType.length})</summary>
                    <ul className="model-list">
                        {support.missingColumns.map(({ model, missing }) => (
                            <li key={model.id}>
                                <span className="dot dot-no" aria-hidden />
                                <span>{modelName(model)}<span className="reason">Needs {missing.join(', ')}</span></span>
                            </li>
                        ))}
                        {support.wrongPeriodType.map(model => (
                            <li key={model.id}>
                                <span className="dot dot-no" aria-hidden />
                                <span>
                                    {modelName(model)}
                                    <span className="reason">Needs {PERIOD_TYPE_LABELS[model.supportedPeriodType?.toLowerCase() ?? ''] ?? 'other'} data</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </details>
            )}
        </section>
    );
};
