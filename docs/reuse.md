# Reuse a block

The repository is private and no package has been published. Add it to your repository as a git submodule and put `vendor/chap-blocks/packages/*` in your pnpm workspace ([steps](../README.md#use-the-blocks-in-another-repository)); a package's name and `workspace:*` dependencies then resolve unchanged. Source exports require TypeScript/JSX and CSS Module support; the included Vite apps show the full setup.

| Want | Packages | Import |
| --- | --- | --- |
| One search field | `packages/ui/src/search.tsx` alone | Your local file; only React required |
| Typed API calls | `packages/api` | `@chap-blocks/api` |
| Calendar helpers | `packages/core` | `@chap-blocks/core` |
| Charts/maps/tables/layout | `packages/ui`, `packages/core`, `packages/api` | `@chap-blocks/ui/charts`, `/maps`, `/tables`, `/layout` |
| Data hooks and notifications | `packages/runtime`, `packages/api` | `@chap-blocks/runtime` |
| Full domain screens | All five packages | `@chap-blocks/modeling/datasets`, `/evaluations`, `/models`, `/predictions`, `/jobs`, `/alerts` |

Run `pnpm install` in the destination workspace. The package manifests specify the remaining third-party dependencies. React and ReactDOM must resolve to one React 18 installation.

## Data with your own UI

```tsx
import { ChapProvider, useChapClient } from '@chap-blocks/runtime';
import { useQuery } from '@tanstack/react-query';

const connection = { baseUrl: '/chap-api' };

function MyDatasets() {
  const chap = useChapClient();
  const query = useQuery({
    queryKey: ['datasets'],
    queryFn: chap.datasets.getDatasetsV1CrudDatasetsGet,
  });
  if (query.isLoading) return <p>Loading…</p>;
  if (query.error instanceof Error) return <p>{query.error.message}</p>;
  return <ul>{query.data?.map(d => <li key={d.id}>{d.name}</li>)}</ul>;
}

<ChapProvider connection={connection}><MyDatasets /></ChapProvider>
```

The service methods are bound, so passing a method as `queryFn` is safe. Different providers can connect to different Chap servers without sharing tokens or cached results. Keep the connection object stable between renders.

## Visualizations without a connection

```tsx
import { UncertaintyAreaChart } from '@chap-blocks/ui/charts';

<UncertaintyAreaChart
  predictionTargetName="Cases"
  series={series}
  chartHeight={320}
/>
```

`series` is a `PredictionOrgUnitSeries`: `targetId`, `orgUnitId`, `orgUnitName`, and `points` containing a period, label and five quantiles. See the runnable examples in `apps/blocks-demo/src/sections/`. Maps receive a feature collection and forecast series as props. They render dataset boundaries on a neutral background by default. Supply `basemap={{ url: tileUrlTemplate, attribution: providerAttribution }}` to opt into your own tile provider. Each map group synchronizes independently. Neither component creates its own API connection. For Vite maps, use `chapAppConfig` from `deploy/vite-app.config.ts`, or copy its `optimizeDeps` configuration: keep the map library's relative worker assets outside prebundling while prebundling its CommonJS dependencies. Production builds copy assets automatically.

Cards, widgets and other DHIS2-styled components use CSS tokens. Mount `CssVariables` from `@dhis2/ui` in your host. `CssReset` is optional and should be controlled by the host.

## Composed feature screens

Full screens use the reference route parameters, breadcrumbs and navigation targets. Mount them inside a React Router **data router**, inside `ChapProvider`, and supply the expected routes. The exported `DatasetUpload` and `SavedDatasetPrediction` forms also use router navigation after a successful mutation. See `packages/modeling/src/App.tsx` for the route contract and `docs/features.md` for destinations.

Use data hooks and UI blocks when you want a completely different navigation structure. Feature pages are reusable compositions, not provider-free widgets.

## Extending

Add presentational UI under `packages/ui`; add server contracts through the OpenAPI generator; add a domain composition under `packages/modeling`. Keep endpoint details out of visual blocks. Do not import `apps/reference` from a package. Add a subpath export when a new independent consumer needs one.
