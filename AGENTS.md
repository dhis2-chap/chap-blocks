# Chap blocks

- Keep packages reusable: never import from `apps/*` in `packages/*`.
- API clients belong to a provider or an explicit function argument. Do not introduce mutable global connection settings.
- UI blocks accept data and callbacks. Optional DHIS2 access belongs in the runtime integration.
- Preserve source attribution and licenses. Do not copy uncommitted upstream work without an explicit reason.
- Regenerate API sources with `pnpm api:generate`; do not hand-edit generated files.
- Run `pnpm check` after a functional change. Test meaningful request/error/state behavior.
- The repository is private. Do not publish packages or change visibility without user authorization.

## Deploying to chap-sandbox

The blocks gallery (`apps/blocks-demo`) is also served at https://chap-sandbox.dhis2.org/blocks/, deployed by `.github/workflows/deploy-sandbox.yml` on every push to `main`. That host is static only: no `/chap-api` proxy, no SPA fallback.

- An app deployed there needs `base: './'` (pass `extend: { base: './' }` to `chapAppConfig`) and hash routing, and must work without `/chap-api`. `blocks-demo` meets all three; `reference`, `signals` and `data-checker` need the proxy, so do not deploy them there as-is.
- To put another app on the host at `/<name>/`, follow AGENTS.md in [dhis2-chap/chap-sandbox](https://github.com/dhis2-chap/chap-sandbox/blob/main/AGENTS.md): `scripts/add-app.sh <name> dhis2-chap/chap-blocks <SECRET_NAME>` there creates the directory and its deploy key, then copy `deploy-sandbox.yml` with a new `concurrency` group, build filter, `dir`, `path` and secret name. Each directory has its own key and secret; never reuse `CHAP_SANDBOX_SSH_KEY` for a second directory.
