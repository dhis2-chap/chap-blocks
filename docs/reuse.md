# Reuse a block

The repository is public; the packages are not published to npm. Add it to your repository as a git submodule and put `vendor/chap-blocks/packages/*` in your pnpm workspace ([steps](../README.md#use-the-blocks-in-another-repository)); a package's name and `workspace:*` dependencies then resolve unchanged. Source exports require TypeScript/JSX and CSS Module support; the included Vite apps show the full setup.

| Want | Packages | Import |
| --- | --- | --- |
| One search field | `packages/ui/src/search.tsx` alone | Your local file; only React required |
| Typed API calls | `packages/api` | `@chap-blocks/api` |
| Pure chart transformations and view-model types (no DOM) | `packages/ui`, `packages/core`, `packages/api` | `@chap-blocks/ui/utils` |
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

## Integrating with an existing application

Keep the host's router, providers, authentication, CSS reset and build plugins. Start with props-only UI blocks and
`@chap-blocks/core`; `ChapProvider` is only required for runtime hooks and composed modeling screens. Import through
the public subpaths, not `packages/*/src` paths or aliases that bypass package exports.

For UI/core reuse alone, include only the three required workspace packages:

```yaml
packages:
  - apps/*
  - packages/*
  - vendor/chap-blocks/packages/api
  - vendor/chap-blocks/packages/core
  - vendor/chap-blocks/packages/ui
```

Add `@chap-blocks/ui` and `@chap-blocks/core` as `workspace:*` dependencies to the consuming app. Include
`vendor/chap-blocks/packages/ui/src/Globals.d.tsx` in its TypeScript configuration, with the path relative to that
configuration file. Only add `runtime`, `modeling` and the MDX declarations/plugins if you actually consume them.
The manifest's `exports` is the authoritative list of available subpaths.

When extending an existing Vite config:

- Preserve the host's React/MDX plugins and development proxy. Do not replace the DHIS2 App Platform shell with
  `chapAppConfig` or add a second React plugin.
- Add `resolve.dedupe` entries for `react`, `react-dom`, `@tanstack/react-query` and `highcharts`. Match the host's
  Highcharts version to the UI package (currently `11.4.9`) so chart module registrations share one instance.
- If using maps, copy `optimizeDeps` from [the shared config](../deploy/vite-app.config.ts). Exclude `@dhis2/maps-gl`
  while including its CommonJS dependencies; otherwise relative worker assets can fail only in development.
- Allow the workspace root in `server.fs.allow` when source packages live outside the app directory.
- Test both development and production builds. TypeScript success does not verify CSS, workers or browser modules.

Use `@chap-blocks/ui/utils` for pure transformations, constants and view-model types in Node tests and schemas.
The root UI barrel also exports browser components and can require browser globals. For example:

```ts
import { buildPredictionSeries, OUTBREAK_PROBABILITY_OPTIONS, monitoringSeries } from '@chap-blocks/ui/utils';
```

`OutbreakMetricsTable` accepts `renderMetricLabel` for host-specific descriptions/help controls. Pass the selected
metric catalog and thresholds as props; fetching and policy selection stay with the host.

### CI and clean checkouts

Every CI job that installs the workspace must initialize the pinned submodule first:

```yaml
- uses: actions/checkout@v4
  with:
    submodules: recursive
- uses: pnpm/action-setup@v4
- run: pnpm install --frozen-lockfile
```

The submodule is public, so the normal checkout token is sufficient. Forks can clone it too. Cache keys should
include the git revision as well as the lockfile when caching compiled host output: a source-only update may not
change the lockfile. Commit the gitlink, `.gitmodules`, workspace configuration and lockfile together.

Validate a new pin with your host's normal checks and a browser smoke test of the consumed blocks. Do not run
`git submodule update --remote` in CI: CI should reproduce the reviewed commit. The [update workflow](../README.md#keeping-up-to-date)
captures the previous commit explicitly because a detached submodule checkout need not populate `ORIG_HEAD`.

### Moving from UI blocks to composed screens

Compare [the route contract](../packages/modeling/src/App.tsx) and [upstream provenance](../UPSTREAM.md) with the host
before replacing a page. The extraction can lag newer host features. Check route parameters, navigation, API contracts,
query invalidation, installation-wide settings and request retry/queue behavior. A nested `ChapProvider` owns a separate
query cache and URL-scoped browser preferences; it does not automatically share a host's cache or DHIS2 datastore settings.

Port missing behavior into the appropriate block before switching the corresponding host screen. Keep DHIS2 route
administration, authority checks and other platform integration in the host. Changes to blocks belong in this repository;
consumers then update their pin to the reviewed commit.
