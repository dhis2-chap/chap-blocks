import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChapProvider, useChapClient } from '@chap-blocks/runtime';
import { SearchField } from '@chap-blocks/ui/search';
import {
    buildOutbreakIndicators,
    buildPredictionSeries,
    getHighestSupportedOutbreakProbability,
    getPeriodNameFromId,
} from '@chap-blocks/ui';
import { CodeBlock, Group, Section } from '../gallery/Section';
import { forecastSeries, orgUnitsById, predictionEntries, thresholdMap } from '../data/synthetic';

const clientCode = `import { createChapClient } from '@chap-blocks/api';

// Each client owns its URL and token; nothing global is configured.
const chap = createChapClient({
  baseUrl: 'http://localhost:8000',
  token: sessionToken,          // optional bearer token
  credentials: 'omit',          // default
});

const datasets = await chap.datasets.getDatasetsV1CrudDatasetsGet();`;

const providerCode = `import { ChapProvider, useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';

const connection = { baseUrl: '/chap-api' };   // keep this object stable

function MyDatasets() {
  const chap = useChapClient();
  const query = useQuery({
    queryKey: ['datasets'],
    // Service methods are bound, so passing one directly is safe.
    queryFn: chap.datasets.getDatasetsV1CrudDatasetsGet,
  });
  if (query.isLoading) return <p>Loading…</p>;
  if (query.error instanceof Error) return <p>{query.error.message}</p>;
  return <ul>{query.data?.map(d => <li key={d.id}>{d.name}</li>)}</ul>;
}

<ChapProvider connection={connection}>
  <MyDatasets />
</ChapProvider>`;

const hostCode = `import { CssVariables } from '@dhis2/ui';

// Once, at the root of a host that renders DHIS2-styled blocks.
<>
  <CssVariables theme spacers colors elevations />
  <App />
</>`;

const helpersCode = `import { buildPredictionSeries, getPeriodNameFromId } from '@chap-blocks/ui';

// Flat prediction rows from Chap → one series per org unit.
const series = buildPredictionSeries(
  predictionEntries,                          // { orgUnit, period, quantile, value }[]
  new Map([['lakeside', { displayName: 'Lakeside' }]]),
  'disease_cases',
  actualCases,                                // optional DataElement[] { pe, ou, value }
  'MONTH',                                    // sort periods properly
);

getPeriodNameFromId('202507');               // "July 2025"
getPeriodNameFromId('2025W09');              // "Week 09 2025"`;

const connection = { baseUrl: '/chap-api' };

function DatasetSearch() {
    const client = useChapClient();
    const [search, setSearch] = useState('');
    const [enabled, setEnabled] = useState(false);
    const query = useQuery({
        queryKey: ['datasets'],
        queryFn: client.datasets.getDatasetsV1CrudDatasetsGet,
        enabled,
    });
    const datasets = query.data?.filter(dataset => dataset.name.toLowerCase().includes(search.toLowerCase()));
    return (
        <div className="stack">
            <div className="row-wrap">
                <button type="button" className="chip chip-on" onClick={() => (enabled ? query.refetch() : setEnabled(true))}>
                    {enabled ? 'Try again' : 'Connect to /chap-api'}
                </button>
                <span className="muted">Optional. Nothing is requested until you click.</span>
            </div>
            {enabled && query.isFetching && <p role="status" className="muted">Asking the server for datasets…</p>}
            {enabled && !query.isFetching && query.isError && (
                <p role="status" className="notice">
                    No Chap server answered at <code>/chap-api</code>. That is expected for this offline gallery; every
                    other example on the page runs without a server.
                </p>
            )}
            {query.data && (
                <>
                    <div className="narrow-field">
                        <SearchField label="Search datasets" value={search} onChange={setSearch} />
                    </div>
                    <ul className="dataset-list">
                        {datasets?.map(dataset => (
                            <li key={dataset.id}>
                                <strong>{dataset.name}</strong>
                                <span className="muted">
                                    {dataset.firstPeriod ?? '?'} – {dataset.lastPeriod ?? '?'}
                                </span>
                            </li>
                        ))}
                        {datasets?.length === 0 && <li className="muted">No datasets match.</li>}
                    </ul>
                </>
            )}
        </div>
    );
}

const indicators = buildOutbreakIndicators(forecastSeries, 75, thresholdMap);
const helperPreview = {
    'buildPredictionSeries(…).length': buildPredictionSeries(predictionEntries, orgUnitsById, 'disease_cases').length,
    "getPeriodNameFromId('202507')": getPeriodNameFromId('202507'),
    "getPeriodNameFromId('2025W09')": getPeriodNameFromId('2025W09'),
    'buildOutbreakIndicators(…, 75, …) outbreaks': indicators.filter(indicator => indicator.outbreak).length,
    'getHighestSupportedOutbreakProbability(…)': getHighestSupportedOutbreakProbability(indicators),
};

export function ClientGroup() {
    return (
        <Group
            id="data"
            title="Data and connection"
            intro="Blocks take plain data. When you want it from Chap, use the typed client directly or through the React provider."
        >
            <Section
                id="helpers"
                title="View-model helpers"
                importFrom="@chap-blocks/ui"
                exports={['buildPredictionSeries', 'getPeriodNameFromId', 'buildOutbreakIndicators', '…']}
                description={
                    <p>
                        Pure functions that turn Chap responses into the shapes the blocks take. Every chart and map on
                        this page is built from synthetic rows through these helpers.
                    </p>
                }
                code={helpersCode}
            >
                <div className="props-wrap">
                <table className="kv">
                    <tbody>
                        {Object.entries(helperPreview).map(([call, result]) => (
                            <tr key={call}>
                                <th scope="row"><code>{call}</code></th>
                                <td><code>{JSON.stringify(result)}</code></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </Section>

            <Section
                id="chap-client"
                title="createChapClient"
                importFrom="@chap-blocks/api"
                exports={['createChapClient']}
                description={
                    <p>
                        The generated, typed Chap Core services without React. A client owns its transport configuration,
                        so several clients can point at different servers in one page.
                    </p>
                }
                props={[
                    { name: 'baseUrl', type: 'string', required: true, description: 'Chap Core URL, or a same-origin proxy path such as /chap-api.' },
                    { name: 'token', type: 'string | Resolver<string>', description: 'Bearer token. Do not bake tokens into VITE_* variables.' },
                    { name: 'credentials', type: 'RequestCredentials', description: "Default 'omit'." },
                ]}
                code={clientCode}
            >
                <p className="muted">Code only — see the provider example below for a live, opt-in request.</p>
            </Section>

            <Section
                id="chap-provider"
                title="ChapProvider and useChapClient"
                importFrom="@chap-blocks/runtime"
                exports={['ChapProvider', 'useChapClient']}
                description={
                    <p>
                        A provider owns one connection's client, React Query cache and notification surface. Different
                        providers never share tokens or cached results.
                    </p>
                }
                props={[
                    { name: 'connection', type: '{ baseUrl, token?, credentials?, dhis2Url? }', required: true, description: 'Keep the object stable between renders.' },
                    { name: 'children', type: 'ReactNode', required: true, description: 'Components that call useChapClient and other runtime hooks.' },
                ]}
                code={providerCode}
            >
                <ChapProvider connection={connection}>
                    <DatasetSearch />
                </ChapProvider>
            </Section>

            <div className="block host-setup" id="host-setup">
                <h3>Host setup</h3>
                <p>
                    Mount the DHIS2 CSS variables once for Card, Widget, Pill and friends. <code>CssReset</code> is
                    optional and up to the host. React and ReactDOM must resolve to a single React 18 copy.
                </p>
                <CodeBlock code={hostCode} label="main.tsx" />
            </div>
        </Group>
    );
}
