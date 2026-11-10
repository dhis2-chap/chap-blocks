# Feature coverage and verification

The standalone reference keeps the committed modeling app's feature screens and visual components. A Chap server is required for modeling work; a DHIS2 server is optional.

| Area | Reference routes (after `#`) | Standalone behavior |
| --- | --- | --- |
| Dashboard | `/dashboard` | Chap overview, model and workflow navigation |
| Datasets | `/datasets`, `/datasets/new`, `/datasets/:datasetId` | Browse/delete saved datasets; import CSV and GeoJSON; per-period input completeness; reuse datasets in evaluations |
| Models | `/models`, `/models/new` | Model templates, configurations, validation and health |
| Evaluations | `/evaluate`, `/evaluate/new`, `/evaluate/:evaluationId` | Evaluate saved datasets with forecast-horizon validation; metrics compared with baseline models; outbreak-detection metrics per signal policy (Chap Core 2.7+); charts and downloads |
| Comparisons | `/evaluate/compare`, `/evaluate/benchmarks` | Evaluation comparisons (including baselines), benchmark specifications and results with reference-model comparison |
| Predictions | `/predictions`, `/predictions/:predictionSetupId` | Create/edit setups from evaluations and inspect prediction activity |
| Forecasting | `/predictions/:predictionSetupId/new` | Submit saved observations with dataset boundaries and a forecast horizon |
| Results | `/predictions/:predictionSetupId/runs/:predictionId` | Regional uncertainty charts, map panels, data table and alert exploration |
| Signals | `/signals` (`/alerts` redirects) and prediction activity | Signal-policy editor with output codes, threshold exploration and forecast signal review/release workflows |
| Jobs | `/jobs` | Job status, logs, cancellation and diagnostic/request downloads |
| Settings | `/settings`, `/settings/modeling-defaults`, `/settings/experimental` | Chap connection, session bearer token, server modeling defaults and browser-local experimental preferences |
| Guides | `/get-started`, `/guides/:guideSlug` | In-app documentation, with standalone getting-started instructions |

The typed API package also exposes the complete checked-in Chap OpenAPI contract. A retained screen or API method is not a claim that every combination of model and server configuration has been tested.

## Optional DHIS2 workflows

These need a configured DHIS2 URL and a usable authenticated browser session or gateway:

- Import analytics with location, period and data-item selectors.
- Create evaluations directly from DHIS2 analytics (`/evaluate/from-dhis2`).
- Import prediction outputs back into DHIS2, including quantile mappings.
- Prune DHIS2 data with the original authority checks.

The standalone default paths use uploaded/saved data. DHIS2-only routes show an integration notice without a configured source. These integration workflows are retained but have **not** been tested against a live DHIS2 instance in this extraction. The embedded DHIS2 visualization plugin is replaced by an analytics table preview.

## Verification

Tested against local Chap Core `2.6.0.dev0` on 2026-10-27, with main-branch alignment and alert-policy verification on 2026-10-28:

- `pnpm check`: TypeScript, ESLint, 294 tests across 47 files, and production builds for both apps.
- Tests cover independent clients, bearer tokens, cookie mode, encoded paths, multipart CSV uploads, authenticated CSV downloads, local settings isolation, optional DHIS2 requests, dataset geometry and prediction-request validation.
- Browser workflow using the synthetic files in `examples/data`: upload dataset → evaluate with Persistence → completed job and evaluation charts → create prediction setup → run a three-month forecast → completed job and regional forecast charts.
- Browser inspection of forecast maps using saved dataset boundaries, and browser-local experimental settings persisted across reloads.
- Docker image build, static frontend response and reverse-proxied Chap system information.
- The separate blocks demo lists/searches real Chap datasets and renders a synthetic uncertainty chart without importing the modeling package.

### Alert-policy data repair (2026-10-28)

Eight legacy test policies in the local development database lacked level output codes, making both `GET /v1/crud/alert-policies` and `GET /v1/crud/prediction-setups` return HTTP 500. The database was already marked at the latest Alembic revision, so running `upgrade head` alone would not repair these records.

All policy rows were backed up before a transaction filled only missing level codes using Chap Core's migration convention: `1`, `2`, … in existing level order (`0` means no alert). Existing names, thresholds, level order and assigned codes were preserved. Both endpoints now return HTTP 200. Browser verification covers listing, creating and deleting an isolated test policy; new policies contain valid output codes.

For another affected database, apply pending Chap Core migrations first. If it is already at the latest revision, inspect and back up the affected rows before applying a targeted repair. The frontend continues to report server errors; it does not silently rewrite backend policies.

### Operational limits

- Model execution, available covariates, future data requirements and scheduling remain Chap Core responsibilities.
- Maps need WebGL. The default draws boundaries without an external basemap; a host can supply a tile provider through the optional `basemap` prop. Dataset polygons come from Chap, not DHIS2 metadata.
- Map and chart dependencies produce some large production chunks. Routes are lazy loaded, and the smaller demo illustrates importing only needed blocks.
- No packages are published to npm. Source-package reuse currently targets React 18 and bundlers that support TypeScript and CSS Modules.
