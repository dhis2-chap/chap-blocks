# @chap-blocks/api

Framework-independent fetch client generated from the checked-in `openapi.json`. Use `createChapClient({ baseUrl, token?, credentials? })`. It creates isolated service instances, binds methods for callbacks, defaults to omitting cookies, and encodes path values.

```ts
const chap = createChapClient({ baseUrl: '/chap-api', token: async () => getCurrentToken() });
const datasets = await chap.datasets.getDatasetsV1CrudDatasetsGet();
```

All generated services and models are available, including models, datasets, backtests, prediction setups, predictions, alert policies, alerts, jobs, metrics, visualizations, system settings and model services. `ApiError` includes HTTP status and the backend response body. Requests return cancelable promises.

## Refresh the contract

```sh
curl --fail http://localhost:8000/openapi.json -o packages/api/openapi.json
pnpm api:generate
pnpm check
```

Use a trusted Chap server. No running server is needed for generation from the saved snapshot. The pinned generator uses instance services, not global OpenAPI configuration. The generator script normalizes OpenAPI 3.1 `contentMediaType: application/octet-stream` file fields to `format: binary` so multipart uploads are typed as Blob.

Do not edit `src/generated` manually. The factory is the only handwritten transport integration. Generated operation names deliberately follow the API contract, avoiding a second layer of renamed methods.
