# Source provenance

The modeling screens, UI blocks and period engine were extracted from https://github.com/dhis2-chap/chap-frontend and initially aligned to `main` at `f50baf86` on 2026-10-28 and updated to `1662146d` (modeling app 7.4.0) on 2026-11-03 (the full revision is recorded below). Only committed source was copied; local edits in the original checkout were not included or modified.

The API is regenerated from a Chap Core `2.7.0.dev0` OpenAPI snapshot, exported from chap-core `master` at `53393ecb`. The snapshot is committed in `packages/api/openapi.json`; generation is reproducible with `pnpm api:generate`.

## License notices

- The upstream repository's root `LICENSE` is GPL-3.0 and is preserved as this repository's `LICENSE`.
- The upstream modeling application's BSD-3-Clause notice is preserved in `packages/modeling/LICENSE`.
- Upstream shared-package manifests declare MIT, while the upstream root license is GPL-3.0. Those original declarations are recorded here rather than being treated as a new license grant.
- Highcharts and the other third-party dependencies retain their own licenses.

This private extraction does not resolve the upstream mismatch or grant a new license to copied code. Package metadata points to the retained license and provenance notices; review upstream licensing before making a public package release.

## Adaptations

The DHIS2 shell and route administration were removed. The connection, notification and preference services now belong to a small runtime package. Feature hooks receive isolated Chap clients; pure helpers accept clients explicitly. File uploads, predictions from stored datasets and stored-boundary maps run without DHIS2. DHIS2 data exchange remains optional. Tests were retained and adapted at these integration boundaries.

Generated API files are upstream server contracts. Reference-screen implementation remains recognizably upstream to make future comparison and updates practical. There is no automatic synchronization that overwrites local adaptations.

Full frontend revision: `1662146dfe0b271bfe99bb7d9e5ce3f41102dbc5` (previously `f50baf86276bfbd542ab8cd4b56a29c5cbb03a22`).

The 2026-11-03 update was a three-way merge of upstream `f50baf86..1662146d` onto the local adaptations. Upstream query keys that included the global `OpenAPI.BASE` were dropped: each connection here has its own query cache. Local standalone user guides were kept, with notes added for upstream features.

Prediction monitoring (`MonitoringWidget`, upstream #302 in `806d3441`) was ported from upstream `main` on 2026-11-10. Its chart and `monitoringSeries` live in `@chap-blocks/ui` as `MonitoringChart`, so the modeling widget only fetches. `OutbreakMetricsTable` in `@chap-blocks/ui` is a props-only version of the scores table in the upstream `OutbreakMetricsWidget`, which stays as upstream wrote it. `SignalReviewTable` (upstream #340 in `32dd06ec`) was ported from upstream `main` on 2026-11-20 into `@chap-blocks/ui`; its grouping moved to `signalReview.ts` so it can be tested, and the default level label is wrapped so it is spaced from the period. The modeling-app review page around it is not ported. The rest of upstream `1662146d..627a4146` is not merged.

The initial extraction included unmerged baseline-comparison widgets from `7d0b696c`. Those widgets were removed when aligning to `main`; the baseline comparisons that later landed in `main` (#320, #325) are included as upstream wrote them.

`ForecastBandsChart`, `ModelContrastBars`, `RankGrid` and `RankingSlopeChart` in `@chap-blocks/ui` were added on 2026-11-20, adapted from views in the Autumn 2026 Webinar Series in https://github.com/dhis2-chap/learning-material at `4817f77` (GPL-3.0, the same license as this repository): the forecast plot from the Session 2 "Reading the bands" slides, `ModelContrastView` and `RankSlope` from `packages/teaching`, and `RankGrid` and `ProvinceBars` from the Session 2 ranking checks, which became the grid's "Ranked first" column. They were rewritten to take Chap data (`PredictionOrgUnitSeries`, `MetricInfo`) through props instead of the decks' teaching data.
