# Chap blocks

- Keep packages reusable: never import from `apps/*` in `packages/*`.
- API clients belong to a provider or an explicit function argument. Do not introduce mutable global connection settings.
- UI blocks accept data and callbacks. Optional DHIS2 access belongs in the runtime integration.
- Preserve source attribution and licenses. Do not copy uncommitted upstream work without an explicit reason.
- Regenerate API sources with `pnpm api:generate`; do not hand-edit generated files.
- Run `pnpm check` after a functional change. Test meaningful request/error/state behavior.
- The repository is private. Do not publish packages or change visibility without user authorization.
