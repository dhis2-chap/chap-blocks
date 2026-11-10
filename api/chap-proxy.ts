/**
 * Vercel counterpart of deploy/nginx.conf: forwards /chap-api/* to CHAP_API_ORIGIN.
 * A visitor's own bearer token is passed through; otherwise CHAP_API_TOKEN is added
 * server-side so the shared token never reaches the browser.
 */
export const PATH_PARAM = '__chap_path';
const FORWARDED_REQUEST_HEADERS = ['accept', 'accept-language', 'content-type', 'authorization'];
const DROPPED_RESPONSE_HEADERS = ['content-encoding', 'content-length', 'transfer-encoding', 'connection', 'set-cookie'];

export type ProxyConfig = { origin?: string; token?: string };

export async function proxyChapRequest(
    request: Request,
    { origin, token }: ProxyConfig,
    fetchImpl: typeof fetch = fetch,
): Promise<Response> {
    if (!origin) return Response.json({ detail: 'CHAP_API_ORIGIN is not configured' }, { status: 500 });
    const incoming = new URL(request.url);
    const path = (incoming.searchParams.get(PATH_PARAM) ?? '').replace(/^\/+/, '');
    incoming.searchParams.delete(PATH_PARAM);
    // Validate the resolved URL: the URL parser also treats encoded dots (%2e) as "..".
    const base = new URL(origin.replace(/\/?$/, '/'));
    const target = new URL(path, base);
    if (/\\|%5c/i.test(path) || target.origin !== base.origin || !target.pathname.startsWith(base.pathname))
        return Response.json({ detail: 'Invalid path' }, { status: 400 });
    target.search = incoming.searchParams.toString();

    const headers = new Headers();
    for (const name of FORWARDED_REQUEST_HEADERS) {
        const value = request.headers.get(name);
        if (value) headers.set(name, value);
    }
    if (!headers.has('authorization') && token) headers.set('authorization', `Bearer ${token}`);

    const hasBody = !['GET', 'HEAD'].includes(request.method);
    let upstream: Response;
    try {
        upstream = await fetchImpl(target, {
            method: request.method,
            headers,
            body: hasBody ? await request.arrayBuffer() : undefined,
            redirect: 'manual',
        });
    } catch {
        return Response.json({ detail: 'Chap server is unreachable' }, { status: 502 });
    }
    const responseHeaders = new Headers(upstream.headers);
    for (const name of DROPPED_RESPONSE_HEADERS) responseHeaders.delete(name);
    return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: responseHeaders });
}

function handle(request: Request) {
    return proxyChapRequest(request, { origin: process.env.CHAP_API_ORIGIN, token: process.env.CHAP_API_TOKEN });
}
export { handle as GET, handle as POST, handle as PUT, handle as PATCH, handle as DELETE };
