import { useState } from 'react';
import {
    DatasetBuilder,
    toDataSources,
    type DatasetDraft,
    type DatasetLocation,
    type DatasetModel,
    type DatasetPeriodType,
    type DatasetVariable,
} from '@chap-blocks/ui/datasets';
import { getPeriodsInRange } from '@chap-blocks/core';
import { Group, Section } from '../gallery/Section';
import { REGIONS } from '../data/synthetic';

const periods = (startPeriodId: string, endPeriodId: string) => getPeriodsInRange({ startPeriodId, endPeriodId, calendar: 'gregory' })
    .map(period => ({ id: period.id, name: period.name }));

const PERIOD_TYPES: DatasetPeriodType[] = [
    { id: 'MONTH', name: 'Monthly', periods: periods('202001', '202512') },
    { id: 'WEEK', name: 'Weekly', periods: periods('2023W1', '2025W52') },
];

// Variables from several sources side by side: the block does not care where the values come from.
const VARIABLES: DatasetVariable[] = [
    { id: 'fbfJHSPpUQD', name: 'Malaria confirmed cases', column: 'disease_cases', source: 'DHIS2' },
    { id: 'pop-worldpop', name: 'Population', column: 'population', source: 'WorldPop', periodTypes: ['MONTH'] },
    { id: 'era5-precip-m', name: 'Total precipitation', column: 'rainfall', source: 'ERA5', periodTypes: ['MONTH'] },
    { id: 'era5-precip-w', name: 'Total precipitation (weekly)', column: 'rainfall', source: 'ERA5', periodTypes: ['WEEK'] },
    { id: 'era5-t2m', name: 'Mean 2m temperature', column: 'mean_temperature', source: 'ERA5' },
    { id: 'era5-rh', name: 'Relative humidity', column: 'relative_humidity', source: 'ERA5' },
    { id: 'chirps', name: 'CHIRPS precipitation', column: 'rainfall', source: 'CHIRPS', periodTypes: ['MONTH'] },
];

const MODELS: DatasetModel[] = [
    { id: 'naive', name: 'Seasonal naive', columns: ['disease_cases'] },
    { id: 'arima', name: 'Climate ARIMA', columns: ['disease_cases', 'rainfall', 'mean_temperature'], periodTypes: ['MONTH'] },
    { id: 'ewars', name: 'EWARS', columns: ['disease_cases', 'rainfall', 'mean_temperature', 'population'], periodTypes: ['MONTH'] },
    { id: 'deepar', name: 'Weekly DeepAR', columns: ['disease_cases', 'rainfall'], periodTypes: ['WEEK'] },
];

// A hierarchy, like DHIS2 org units: only the regions go into the dataset, North and South group them.
const LOCATIONS: DatasetLocation[] = [
    { id: 'north', name: 'North' },
    { id: 'south', name: 'South' },
    ...REGIONS.map((region, index) => ({ id: region.id, name: region.name, parentId: index < 3 ? 'north' : 'south' })),
];

const builderCode = `import { DatasetBuilder, toDataSources } from '@chap-blocks/ui/datasets';

<DatasetBuilder
  variables={[                        // from DHIS2, OCS, CAPS, an upload…
    { id: 'fbfJHSPpUQD', name: 'Malaria cases', column: 'disease_cases', source: 'DHIS2' },
    { id: 'era5-precip', name: 'Total precipitation', column: 'rainfall', source: 'ERA5', periodTypes: ['MONTH'] },
  ]}
  locations={[                        // flat, or a tree with parentId
    { id: 'ImspTQPwCqd', name: 'Sierra Leone' },
    { id: 'O6uvpzGd5pu', name: 'Bo', parentId: 'ImspTQPwCqd' },
  ]}
  // or bring your own picker, e.g. a lazily loaded org unit tree:
  // renderLocations={({ selected, onChange, disabled }) => <OrgUnitTree … />}
  periodTypes={[{ id: 'MONTH', name: 'Monthly', periods: [{ id: '202401', name: 'January 2024' }, …] }]}
  models={toDatasetModels(models)}    // optional, from '@chap-blocks/modeling/datasets'
  submitting={isSaving}
  onSubmit={draft => {
    // The host fetches the values and saves the dataset, e.g. as a Chap Core DatasetMakeRequest:
    save({ name: draft.name, targetColumn: draft.targetColumn, dataSources: toDataSources(draft), … });
  }}
/>`;

function BuilderExample() {
    const [submitted, setSubmitted] = useState<DatasetDraft>();
    const [saving, setSaving] = useState(false);
    const [run, setRun] = useState(0);
    return (
        <div className="stack">
            <DatasetBuilder
                key={run}
                variables={VARIABLES}
                locations={LOCATIONS}
                periodTypes={PERIOD_TYPES}
                models={MODELS}
                initialDraft={{ columns: [{ name: 'disease_cases', variableId: 'fbfJHSPpUQD' }] }}
                submitting={saving}
                onCancel={() => {
                    setSubmitted(undefined);
                    setRun(n => n + 1);
                }}
                onSubmit={(draft) => {
                    setSaving(true);
                    window.setTimeout(() => {
                        setSaving(false);
                        setSubmitted(draft);
                    }, 600);
                }}
            />
            {submitted && (
                <figure className="code">
                    <figcaption><span>onSubmit received, and toDataSources(draft)</span></figcaption>
                    <pre><code>{JSON.stringify({ draft: submitted, dataSources: toDataSources(submitted) }, null, 2)}</code></pre>
                </figure>
            )}
        </div>
    );
}

export function DatasetsGroup() {
    return (
        <Group
            id="datasets"
            title="Datasets"
            intro="Build a dataset from whatever data a host can supply. The block chooses; the host fetches and saves."
        >
            <Section
                id="dataset-builder"
                title="DatasetBuilder"
                importFrom="@chap-blocks/ui/datasets"
                exports={['DatasetBuilder', 'toDataSources']}
                wide
                description={(
                    <p>
                        A form for a dataset: name, period range, locations (a list, a tree or your own picker) and named columns, each taking its values from one
                        variable. Variables can come from any source (DHIS2 data elements, climate datasets, CAPS, an upload),
                        and those without values for the chosen period type are hidden. With <code>models</code>, a side panel
                        shows which models can run on the dataset and adds the columns they miss. Submit returns a plain
                        draft; validation and model fit are exported as pure functions.
                    </p>
                )}
                props={[
                    { name: 'variables', type: 'DatasetVariable[]', required: true, description: '{ id, name, column?, source?, periodTypes? }. `column` is the name suggested when it is chosen.' },
                    { name: 'locations', type: 'DatasetLocation[]', description: '{ id, name, parentId? }. Flat shows a multi-select; with parentId a tree, where only locations without children are chosen.' },
                    { name: 'renderLocations', type: '(props: DatasetLocationPickerProps) => ReactNode', description: 'Your own picker instead, given { selected, onChange, disabled, error }. For large or lazily loaded trees such as DHIS2 org units.' },
                    { name: 'periodTypes', type: 'DatasetPeriodType[]', required: true, description: '{ id, name, periods }, periods in chronological order. With one, the period type field is hidden.' },
                    { name: 'onSubmit', type: '(draft: DatasetDraft) => void', required: true, description: 'Called with a valid draft and its target column resolved.' },
                    { name: 'models', type: 'DatasetModel[]', description: '{ id, name, columns, periodTypes? }. Shows the model panel. `toDatasetModels` converts Chap models.' },
                    { name: 'initialDraft', type: 'Partial<DatasetDraft>', description: 'Starting values. Change `key` to start again.' },
                    { name: 'onChange', type: '(draft: DatasetDraft) => void', description: 'Every edit, for example to save a draft.' },
                    { name: 'submitting, disabled', type: 'boolean', description: 'Lock the form; `submitting` also shows progress.' },
                    { name: 'onCancel, submitLabel, children', type: '…', description: 'Cancel button, submit text, and host content under the form, such as a save error.' },
                ]}
                code={builderCode}
            >
                <BuilderExample />
            </Section>
        </Group>
    );
}
