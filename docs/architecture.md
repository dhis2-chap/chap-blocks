# Architecture

The reusable packages and reference app live in one pnpm workspace. There is no build orchestrator, backend proxy framework, global service locator or DHIS2 shell.

```text
reference app ─── modeling features ─── ui blocks ─── core
                       │                   │
                       ├── runtime ─── api ┘ (types)
                       └── api

blocks demo ─── ui/search + ui/charts + runtime + api
```

## Boundaries

- **api** contains a generated fetch client, types and a small client factory. Each client owns its URL, bearer-token resolver and credential mode. The API package has no React or DHIS2 dependency.
- **core** provides the extracted period engine. It uses DHIS2's calendar library as an ordinary npm dependency; it does not talk to a DHIS2 instance.
- **ui** contains components receiving values and callbacks. Charts/maps are independent of routing, local storage and connection state. Use subpath exports to select a surface instead of importing the full barrel.
- **runtime** owns integration state. `ChapProvider` creates a client and query cache per connection. `useChapClient` accesses that instance. Optional DHIS2 requests are handled separately; Chap tokens are never forwarded to DHIS2. Browser preferences use a Chap-URL-scoped key.
- **modeling** composes those pieces into the existing workflows. Pure request helpers take an explicit client. React hooks obtain it from the provider. No feature imports application source, reads an application alias or edits a global API base URL.
- **reference** holds the entry point, header, environment configuration and connection persistence. It can be replaced by another app shell.

## Choices

React 18 and the DHIS2 component library preserve upstream behavior and appearance. Depending on a UI library does not require running the app inside DHIS2. The reference app uses React Router's data router because the existing forms rely on navigation blocking and breadcrumbs. Complete feature pages therefore require a data router; small visual blocks do not.

The source packages expose TypeScript and CSS Modules. Vite and other source-aware bundlers compile them directly. This keeps extraction readable and avoids a second compiled copy of each file. It is not a claim of Node/CommonJS or CDN distribution support.

The large modeling package deliberately retains mature forms, chart transformations and tests instead of replacing functionality with mock screens. New smaller products should start from `apps/blocks-demo` and import only what they need. Splitting domain features further should follow actual independent consumers.

## Optional DHIS2

DHIS2-only actions are explicit integration features: analytics import, location/data-item selection, data pruning and writing predictions back. They are guarded when no source is configured. Standalone evaluations use location identifiers; prediction maps use boundaries stored in Chap datasets. No synthetic DHIS2 identity or metadata is invented.

## State

Server data is cached in TanStack Query. Each provider owns its cache. Connection URL changes and token changes replace the cache. Secrets are passed into the client and are not committed or embedded in builds. The reference app stores its token in session storage; a production host may instead supply a token resolver from its own authentication flow.
