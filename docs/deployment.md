# Deploy the standalone app

## Static hosting

1. `pnpm install --frozen-lockfile && pnpm build`
2. Serve `apps/reference/dist`.
3. Forward `/chap-api/*` to your Chap Core API, stripping `/chap-api` from the path. The sample nginx configuration does this.
4. Put your normal HTTPS and access-control layer in front of the host. The frontend does not implement a separate user database; Chap's token or your gateway controls backend access.

Alternatively, set `VITE_CHAP_API_URL` when building, or configure a direct API URL in Settings. A cross-origin Chap API must allow the frontend's origin and Authorization header through CORS.

`pnpm preview` previews the built app locally. Do not rely on Vite's development proxy for production hosting.

## Container

```sh
docker build -t chap-blocks .
docker run --rm -p 5180:80 \
  -e CHAP_API_ORIGIN=http://host.docker.internal:8000 \
  chap-blocks
```

`host.docker.internal` is available in Docker Desktop. On Linux, supply `--add-host=host.docker.internal:host-gateway`, or put the frontend and Chap on the same Docker network and use the Chap service name. `CHAP_API_ORIGIN` is the internal backend origin without a trailing slash.

The container serves only the frontend and reverse proxy. Chap's database, workers and models remain managed by Chap Core. The proxy forwards the browser's Authorization header; it does not inject or persist a token.

## Optional DHIS2

Use an HTTPS DHIS2 URL in Settings. The data-source adapter sends requests to that instance with browser credentials. A separately hosted DHIS2 instance must allow the frontend origin and credentialed requests; browser cookie policy also applies. If that is not possible, expose the DHIS2 API through your own authenticated gateway. No Chap token is sent to DHIS2.

Browser-local preferences do not become shared DHIS2 datastore records. Modeling defaults are stored on Chap and remain shared.

## Vercel (all reference apps, one project)

`vercel.json` builds every app (`pnpm build:site`), and `scripts/assemble-site.mjs` copies each `apps/<app>/dist` into `site/<app>/`. Host-based rewrites serve one folder per subdomain:

| Host | App folder | Purpose |
| --- | --- | --- |
| `modeling.edvinas.no` | `reference` | Full modeling workspace |
| `signals.edvinas.no` | `signals` | Latest forecasts and outbreak signals by region |
| `blocks.edvinas.no` | `blocks-demo` | Offline gallery of the UI blocks |
| `data.edvinas.no` | `data-checker` | Check CSV + GeoJSON input files before import |
| `chap.edvinas.no` | — | Permanent (308) redirect to `modeling.edvinas.no`, configured as a domain redirect on the Vercel project |

Any other host, such as a preview URL, serves the modeling workspace at `/` and every app at `/<app>/`.

`/chap-api/*` goes to the `api/chap-proxy.ts` function on every host. It forwards to `CHAP_API_ORIGIN` and adds `CHAP_API_TOKEN` server-side when the browser sends no `Authorization` header. Both variables are set for Production only, so preview deployments answer `/chap-api` with a configuration error. Every host gets the same full proxy, so anyone who can open one of the sites can also send write requests to Chap with the shared token. That is intended for the demo instance; protect the deployment, or narrow the proxy, before you point it at a server whose data matters. If Chap is unreachable the proxy answers 502 with a JSON `detail`. The function buffers request bodies, and Vercel caps them at about 4.5 MB; for larger dataset uploads point the app's API URL at Chap directly (with CORS) or use the nginx setup.

To add an app, create `apps/<name>` with `vite.config.ts` calling `chapAppConfig` from `deploy/vite-app.config.ts`, then add its host to `vercel.json` and to the domain list on the Vercel project (`vercel domains add <host> chap-blocks`).

Development ports: reference 5180, blocks gallery 5181, data checker 5184, signals 5186 (strict: a busy port fails instead of moving).
