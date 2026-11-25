import { useState } from 'react';
import {
    DatasetBuilder,
    LocationPicker,
    toDataSources,
    type DatasetDraft,
    type DatasetModel,
    type DatasetPeriodType,
    type DatasetVariable,
    type LocationOption,
} from '@chap-blocks/ui/datasets';
import { Group, Section } from '../gallery/Section';
import { REGIONS } from '../data/synthetic';

// Period ids are in the host's calendar, so the bounds differ per calendar.
const CALENDARS = {
    gregory: { name: 'Gregorian', periodTypes: [
        { id: 'MONTHLY', name: 'Monthly', minPeriodId: '202001', maxPeriodId: '202512' },
        { id: 'WEEKLY', name: 'Weekly', minPeriodId: '2023W1', maxPeriodId: '2025W52' },
    ] },
    ethiopic: { name: 'Ethiopian', periodTypes: [
        { id: 'MONTHLY', name: 'Monthly', minPeriodId: '201201', maxPeriodId: '201812' },
        { id: 'WEEKLY', name: 'Weekly', minPeriodId: '2015W1', maxPeriodId: '2018W52' },
    ] },
    nepali: { name: 'Nepali', periodTypes: [
        { id: 'MONTHLY', name: 'Monthly', minPeriodId: '207601', maxPeriodId: '208212' },
    ] },
} satisfies Record<string, { name: string; periodTypes: DatasetPeriodType[] }>;
type DemoCalendar = keyof typeof CALENDARS;

// Variables from several sources side by side: the block does not care where the values come from.
const VARIABLES: DatasetVariable[] = [
    { id: 'fbfJHSPpUQD', name: 'Malaria confirmed cases', column: 'disease_cases', source: 'DHIS2' },
    { id: 'pop-worldpop', name: 'Population', column: 'population', source: 'WorldPop', periodTypes: ['MONTHLY'] },
    { id: 'era5-precip-m', name: 'Total precipitation', column: 'rainfall', source: 'ERA5', periodTypes: ['MONTHLY'] },
    { id: 'era5-precip-w', name: 'Total precipitation (weekly)', column: 'rainfall', source: 'ERA5', periodTypes: ['WEEKLY'] },
    { id: 'era5-t2m', name: 'Mean 2m temperature', column: 'mean_temperature', source: 'ERA5' },
    { id: 'era5-rh', name: 'Relative humidity', column: 'relative_humidity', source: 'ERA5' },
    { id: 'chirps', name: 'CHIRPS precipitation', column: 'rainfall', source: 'CHIRPS', periodTypes: ['MONTHLY'] },
];

const MODELS: DatasetModel[] = [
    { id: 'naive', name: 'Seasonal naive', columns: ['disease_cases'] },
    { id: 'arima', name: 'Climate ARIMA', columns: ['disease_cases', 'rainfall', 'mean_temperature'], periodTypes: ['MONTHLY'] },
    { id: 'ewars', name: 'EWARS', columns: ['disease_cases', 'rainfall', 'mean_temperature', 'population'], periodTypes: ['MONTHLY'] },
    { id: 'deepar', name: 'Weekly DeepAR', columns: ['disease_cases', 'rainfall'], periodTypes: ['WEEKLY'] },
];

// A hierarchy, like DHIS2 org units: only the regions go into the dataset, North and South group them.
const LOCATIONS: LocationOption[] = [
    { id: 'north', name: 'North' },
    { id: 'south', name: 'South' },
    ...REGIONS.map((region, index) => ({ id: region.id, name: region.name, parentId: index < 3 ? 'north' : 'south' })),
];

const builderCode = `import { DatasetBuilder, toDataSources } from '@chap-blocks/ui/datasets';

<DatasetBuilder
  variables={[                        // from DHIS2, OCS, CAPS, an upload…
    { id: 'fbfJHSPpUQD', name: 'Malaria cases', column: 'disease_cases', source: 'DHIS2' },
    { id: 'era5-precip', name: 'Total precipitation', column: 'rainfall', source: 'ERA5', periodTypes: ['MONTHLY'] },
  ]}
  locations={[                        // flat, or a tree with parentId
    { id: 'ImspTQPwCqd', name: 'Sierra Leone' },
    { id: 'O6uvpzGd5pu', name: 'Bo', parentId: 'ImspTQPwCqd' },
  ]}
  // or bring your own picker, e.g. a lazily loaded org unit tree:
  // renderLocations={({ selected, onChange, disabled }) => <OrgUnitTree … />}
  periodTypes={[{ id: 'MONTHLY', name: 'Monthly', minPeriodId: '202001' }]}  // DHIS2 period types
  calendar="gregory"                  // or 'ethiopic', 'nepali', …; normalizeDhis2CalendarSetting maps the DHIS2 setting
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
    const [calendar, setCalendar] = useState<DemoCalendar>('gregory');
    return (
        <div className="stack">
            <div className="toolbar" role="group" aria-label="Calendar">
                <span>Calendar</span>
                {(Object.keys(CALENDARS) as DemoCalendar[]).map(id => (
                    <button
                        key={id}
                        type="button"
                        className={id === calendar ? 'chip chip-on' : 'chip'}
                        aria-pressed={id === calendar}
                        onClick={() => {
                            setCalendar(id);
                            setSubmitted(undefined);
                        }}
                    >
                        {CALENDARS[id].name}
                    </button>
                ))}
            </div>
            <DatasetBuilder
                key={`${calendar}-${run}`}
                variables={VARIABLES}
                locations={LOCATIONS}
                periodTypes={CALENDARS[calendar].periodTypes}
                calendar={calendar}
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

const pickerCode = `import { LocationPicker } from '@chap-blocks/ui/datasets';

const [selected, setSelected] = useState<string[]>([]);

<LocationPicker
  locations={[                        // from any source; flat, or a tree with parentId
    { id: 'north', name: 'North' },
    { id: 'lakeside', name: 'Lakeside', parentId: 'north' },
  ]}
  selected={selected}                 // only locations without children
  onChange={setSelected}
/>`;

const FLAT_LOCATIONS = REGIONS.map(region => ({ id: region.id, name: region.name }));

function PickerExample() {
    const [tree, setTree] = useState<string[]>(['lakeside']);
    const [flat, setFlat] = useState<string[]>([]);
    return (
        <div className="stack">
            <LocationPicker label="A tree, with parentId" locations={LOCATIONS} selected={tree} onChange={setTree} />
            <LocationPicker label="A flat list" locations={FLAT_LOCATIONS} selected={flat} onChange={setFlat} />
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
                    { name: 'variables', type: 'DatasetVariable[]', required: true, description: '{ id, name, column?, source?, periodTypes? }. `column` is the name suggested when it is chosen; periodTypes are DHIS2 period types.' },
                    { name: 'locations', type: 'LocationOption[]', description: '{ id, name, parentId? }. Flat shows a multi-select; with parentId a tree, where only locations without children are chosen.' },
                    { name: 'renderLocations', type: '(props: DatasetLocationPickerProps) => ReactNode', description: 'Your own picker instead, given { selected, onChange, disabled, error }. For large or lazily loaded trees such as DHIS2 org units.' },
                    { name: 'periodTypes', type: 'DatasetPeriodType[]', required: true, description: '{ id, name, minPeriodId?, maxPeriodId? }, id a DHIS2 period type such as MONTHLY. With one, the period type field is hidden.' },
                    { name: 'calendar, locale', type: 'Dhis2Calendar, string', description: 'Calendar the period pickers show; gregory by default.' },
                    { name: 'onSubmit', type: '(draft: DatasetDraft) => void', required: true, description: 'Called with a valid draft and its target column resolved.' },
                    { name: 'models', type: 'DatasetModel[]', description: '{ id, name, columns, periodTypes? }. Shows the model panel. `toDatasetModels` converts Chap models, including their period type.' },
                    { name: 'initialDraft', type: 'Partial<DatasetDraft>', description: 'Starting values. Change `key` to start again.' },
                    { name: 'onChange', type: '(draft: DatasetDraft) => void', description: 'Every edit, for example to save a draft.' },
                    { name: 'submitting, disabled', type: 'boolean', description: 'Lock the form; `submitting` also shows progress.' },
                    { name: 'onCancel, submitLabel, children', type: '…', description: 'Cancel button, submit text, and host content under the form, such as a save error.' },
                ]}
                code={builderCode}
            >
                <BuilderExample />
            </Section>
            <Section
                id="location-picker"
                title="LocationPicker"
                importFrom="@chap-blocks/ui/datasets"
                exports={['LocationPicker']}
                description={(
                    <p>
                        Choose locations from any source. A flat list shows as a filterable multi-select; locations with a
                        {' '}<code>parentId</code> show as a tree, where checking a group checks everything under it and only
                        locations without children are chosen. Both offer to select all. DatasetBuilder uses it.
                    </p>
                )}
                props={[
                    { name: 'locations', type: 'LocationOption[]', required: true, description: '{ id, name, parentId? }.' },
                    { name: 'selected', type: 'string[]', required: true, description: 'Chosen location ids.' },
                    { name: 'onChange', type: '(selected: string[]) => void', required: true, description: 'Every change.' },
                    { name: 'label, error, disabled, dataTest', type: '…', description: 'Field label (default "Locations"), validation text, lock and test id.' },
                ]}
                code={pickerCode}
            >
                <PickerExample />
            </Section>
        </Group>
    );
}
