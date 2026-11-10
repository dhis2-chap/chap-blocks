# Chap blocks

Reusable React and TypeScript blocks for [Chap Core](https://github.com/dhis2-chap/chap-core): a typed API client,
period utilities, charts, maps and tables, data hooks, and composed modeling screens. Use one chart or a whole
workflow; nothing requires DHIS2 or an app shell. Not published to npm: other repositories use the blocks through a
[pinned git submodule](#use-the-blocks-in-another-repository).

**Browse them in the [blocks gallery](https://blocks.edvinas.no)** (`pnpm dev:blocks`): every UI block with
synthetic data, its props and a usage snippet.

## Packages

| Package | What it gives you | Needs a server? |
| --- | --- | --- |
| `@chap-blocks/api` | Generated, typed Chap services; isolated clients and authentication | For requests only |
| `@chap-blocks/core` | Period/calendar calculations and domain utilities | No |
| `@chap-blocks/ui` | Charts, maps, tables, cards, navigation, period controls and search | No; accepts data as props |
| `@chap-blocks/runtime` | React provider, per-connection query cache, local preferences, notifications, optional DHIS2 data source | For data hooks |
| `@chap-blocks/modeling` | Composed feature screens and workflows extracted from the modeling app | Chap Core |

Packages have explicit exports and only depend downward (`api`, `core` → `ui`, `runtime` → `modeling`). See
[architecture](docs/architecture.md) and [reusing blocks](docs/reuse.md).

## Use just one block

```tsx
import { SearchField } from '@chap-blocks/ui/search';

<SearchField label="Search models" value={search} onChange={setSearch} />
```

Or use Chap without React:

```ts
import { createChapClient } from '@chap-blocks/api';

const chap = createChapClient({ baseUrl: 'http://localhost:8000' });
const datasets = await chap.datasets.getDatasetsV1CrudDatasetsGet();
```

## Use the blocks in another repository

The packages are **not published to npm**. They export TypeScript source, so another repository adds this one as a
pinned **git submodule** and makes its packages part of its own pnpm workspace. There's no build or publish step, and
imports are the same as here. [dhis2-chap/learning-material](https://github.com/dhis2-chap/learning-material) works this way.

1. Add the submodule, tracking `main`:

   ```sh
   git submodule add -b main https://github.com/dhis2-chap/chap-blocks.git vendor/chap-blocks
   ```

2. Add its packages to `pnpm-workspace.yaml`, next to your own:

   ```yaml
   packages:
     - apps/*
     - vendor/chap-blocks/packages/*
   ```

3. Depend on the blocks you use, with `workspace:*`, and run `pnpm install`:

   ```json
   "dependencies": { "@chap-blocks/ui": "workspace:*", "@chap-blocks/api": "workspace:*" }
   ```

4. Build with the same Vite settings as these apps (React, the `/chap-api` development proxy, map-library hints,
   one React instance):

   ```ts
   // vite.config.ts
   import { chapAppConfig } from './vendor/chap-blocks/deploy/vite-app.config';
   export default chapAppConfig({ port: 5190 });
   ```

   The config imports `vite` and `@vitejs/plugin-react` from your repository, so list both as devDependencies in your
   **root** `package.json`. If you use `@chap-blocks/modeling`, its guides are MDX: add the MDX plugin and
   `publicDir` the way [`apps/reference/vite.config.ts`](apps/reference/vite.config.ts) does.

5. For `tsc`, include the blocks' ambient module declarations in your `tsconfig.json`:

   ```json
   "include": ["src", "vendor/chap-blocks/packages/ui/src/Globals.d.tsx", "vendor/chap-blocks/packages/modeling/src/Globals.d.ts", "vendor/chap-blocks/packages/modeling/src/mdx.d.ts"]
   ```

   Mount `CssVariables` from `@dhis2/ui` once in your app (see [reuse](docs/reuse.md) for providers and which package gives what).

Clone with `git clone --recurse-submodules …` (or run `git submodule update --init` afterwards). This repository is
private, so everyone who clones needs read access to it.

### Keeping up to date

Your repository pins an exact chap-blocks commit, so a push here never changes another project by itself. To update:

```sh
git submodule update --remote vendor/chap-blocks   # move to the tip of main
git -C vendor/chap-blocks log --oneline ORIG_HEAD..HEAD
pnpm install && pnpm check                          # your own checks
git add vendor/chap-blocks pnpm-lock.yaml && git commit -m "chore: update chap-blocks"
```

To roll back, check out the previous commit in `vendor/chap-blocks` and commit that. Change the blocks here, never
inside `vendor/`: push to this repository, then update. Breaking changes to a package's exports should say so in the
commit message, because consumers read that log when they update.

## Reference apps

Small apps that show the blocks composed. They are examples, not products.

| App | What it shows | Needs a server? |
| --- | --- | --- |
| `apps/blocks-demo` | The blocks gallery: every UI block with synthetic data, no modeling package | No |
| `apps/reference` | The full modeling workspace, a thin shell around `@chap-blocks/modeling` | Chap Core |
| `apps/signals` | A read-only dashboard: latest forecast signals per region (map, ranking, uncertainty chart) | Chap Core |
| `apps/data-checker` | Checks CSV + GeoJSON input files in the browser; optional import into Chap | Only for import |

Parked on their own branches: `app/model-catalog`, `app/role-flow` (forecast workflow split by role) and `app/learn`
(training slides, continued in [dhis2-chap/learning-material](https://github.com/dhis2-chap/learning-material)).

### Run them

Use Node.js 22+ and pnpm 10.29.3. Start a compatible Chap Core server at `http://localhost:8000`, then:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:5180`. The development server forwards `/chap-api` to Chap; no DHIS2 route is involved. In **Settings**, configure a different API URL or a session-only bearer token.

To change the development proxy target, copy `apps/reference/.env.example` to `apps/reference/.env.local` and edit `CHAP_PROXY_TARGET`. Never put tokens in `VITE_*` variables: they are embedded in browser builds.

```sh
pnpm dev:blocks   # blocks gallery at http://127.0.0.1:5181
pnpm dev:data     # data checker at http://127.0.0.1:5184
pnpm dev:signals  # signals dashboard at http://127.0.0.1:5186
pnpm check       # typecheck, lint, tests, build every app
```

### What the modeling workspace covers

- Import CSV + GeoJSON; browse and reuse saved datasets.
- Configure models and inspect model templates and health.
- Run evaluations, compare models and benchmarks, inspect metrics and visualizations.
- Create prediction setups; forecast from saved observations; view uncertainty charts, tables and maps.
- Create alert policies, view forecast alerts and approval information.
- Monitor jobs, inspect logs, cancel runs and download requests or diagnostics.
- Configure server modeling defaults and browser-local preferences.
- Optionally connect DHIS2 for organisation-unit selection, analytics imports, prediction export and data pruning.

Start with the synthetic files in [examples/data](examples/data). They contain no patient data. The current Chap CSV endpoint assigns the name `csv_file`; the UI describes that server behavior.

See the [feature and verification matrix](docs/features.md) for route coverage and integration boundaries.

## Build and serve

`pnpm build` produces `apps/<app>/dist` for every app; `pnpm build:site` also assembles them for the multi-app Vercel deployment (one subdomain per app, see [deployment](docs/deployment.md#vercel-all-reference-apps-one-project)). Serve the reference build with any static host. The application uses hash routes, so it does not need server-side route fallback.

The Vite proxy is for development. For deployment, configure your reverse proxy to forward `/chap-api/*` to Chap, or set a direct Chap URL with the appropriate CORS policy. A sample [nginx configuration](deploy/nginx.conf) and [Dockerfile](Dockerfile) are included. See [deployment](docs/deployment.md).

## API contract and provenance

The checked-in OpenAPI snapshot targets Chap Core `2.7.0.dev0`. Regenerate with `pnpm api:generate`; see [API maintenance](packages/api/README.md). Server-version feature checks from the modeling app are retained.

Extracted source and its revision are recorded in [UPSTREAM.md](UPSTREAM.md). Original license notices are preserved; this private repository has not published packages or changed upstream licensing. Highcharts retains its own licensing terms.
