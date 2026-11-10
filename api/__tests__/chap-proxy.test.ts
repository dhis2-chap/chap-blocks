import { describe, expect, it, vi } from 'vitest';
import { PATH_PARAM, proxyChapRequest } from '../chap-proxy';

const origin = 'https://chap.example/chap/stable';
function captured(fetchImpl: ReturnType<typeof vi.fn>) {
    const [url, init] = fetchImpl.mock.calls[0] as [URL, RequestInit];
    return { url: url.toString(), init, headers: init.headers as Headers };
}

describe('proxyChapRequest', () => {
    it('forwards path and query to the origin with the server token', async () => {
        const fetchImpl = vi.fn(async () => new Response('{"ok":true}', { headers: { 'content-type': 'application/json', 'set-cookie': 'a=b' } }));
        const request = new Request(`https://site.example/api/chap-proxy?${PATH_PARAM}=v1/crud/models&limit=5`, { headers: { cookie: 'session=1' } });
        const response = await proxyChapRequest(request, { origin, token: 'server-token' }, fetchImpl);
        const { url, headers } = captured(fetchImpl);
        expect(url).toBe('https://chap.example/chap/stable/v1/crud/models?limit=5');
        expect(headers.get('authorization')).toBe('Bearer server-token');
        expect(headers.has('cookie')).toBe(false);
        expect(response.headers.has('set-cookie')).toBe(false);
        expect(await response.json()).toEqual({ ok: true });
    });

    it('keeps a visitor-supplied token instead of the server token', async () => {
        const fetchImpl = vi.fn(async () => new Response(null, { status: 204 }));
        const request = new Request(`https://site.example/api/chap-proxy?${PATH_PARAM}=v1/jobs/1`, { method: 'DELETE', headers: { authorization: 'Bearer own-token' } });
        await proxyChapRequest(request, { origin, token: 'server-token' }, fetchImpl);
        expect(captured(fetchImpl).headers.get('authorization')).toBe('Bearer own-token');
    });

    it('forwards request bodies and upstream errors', async () => {
        const fetchImpl = vi.fn(async () => Response.json({ detail: 'bad' }, { status: 422 }));
        const request = new Request(`https://site.example/api/chap-proxy?${PATH_PARAM}=v1/analytics/make-prediction`, { method: 'POST', body: '{"a":1}', headers: { 'content-type': 'application/json' } });
        const response = await proxyChapRequest(request, { origin }, fetchImpl);
        const { init, headers } = captured(fetchImpl);
        expect(new TextDecoder().decode(init.body as ArrayBuffer)).toBe('{"a":1}');
        expect(headers.has('authorization')).toBe(false);
        expect(response.status).toBe(422);
    });

    it('answers 502 when the Chap server is unreachable', async () => {
        const fetchImpl = vi.fn(async () => { throw new TypeError('fetch failed'); });
        const response = await proxyChapRequest(new Request(`https://site.example/api/chap-proxy?${PATH_PARAM}=v1/health`), { origin }, fetchImpl);
        expect(response.status).toBe(502);
        expect(await response.json()).toEqual({ detail: 'Chap server is unreachable' });
    });

    it('rejects path traversal and a missing origin', async () => {
        const fetchImpl = vi.fn();
        const traversal = new Request(`https://site.example/api/chap-proxy?${PATH_PARAM}=v1/../../admin`);
        expect((await proxyChapRequest(traversal, { origin }, fetchImpl)).status).toBe(400);
        for (const path of ['%2e%2e/admin', 'v1/%2E%2E/%2e%2e/%2e%2e/x', '..%5Cadmin', 'https://evil.example/x']) {
            const request = new Request(`https://site.example/api/chap-proxy?${PATH_PARAM}=${encodeURIComponent(path)}`);
            expect((await proxyChapRequest(request, { origin }, fetchImpl)).status, path).toBe(400);
        }
        expect((await proxyChapRequest(new Request('https://site.example/api/chap-proxy'), {}, fetchImpl)).status).toBe(500);
        expect(fetchImpl).not.toHaveBeenCalled();
    });
});
