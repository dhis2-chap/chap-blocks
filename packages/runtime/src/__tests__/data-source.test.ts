import { afterEach, describe, expect, it, vi } from 'vitest';
import { createDataSource } from '../data-source';
function memoryStorage(): Storage {
    const entries = new Map<string, string>();
    return {
        get length() {
            return entries.size;
        },
        clear: () => entries.clear(),
        getItem: (key) => entries.get(key) ?? null,
        key: (index) => [...entries.keys()][index] ?? null,
        removeItem: (key) => {
            entries.delete(key);
        },
        setItem: (key, value) => {
            entries.set(key, value);
        },
    };
}
afterEach(() => vi.unstubAllGlobals());
describe('host-independent settings and optional data source', () => {
    it('keeps settings local and scoped to the connected Chap server', async () => {
        const storage = memoryStorage();
        const a = createDataSource('/one', undefined, storage);
        const b = createDataSource('/two', undefined, storage);
        const resource = 'dataStore/modeling/experimental';
        await a.mutate({ resource, type: 'update', data: { enabled: true } });
        expect(await a.query({ settings: { resource } })).toEqual({
            settings: { enabled: true },
        });
        await expect(b.query({ settings: { resource } })).rejects.toMatchObject(
            { details: { httpStatusCode: 404 } },
        );
    });
    it('needs no DHIS2 connection for default calendar settings', async () => {
        expect(
            await createDataSource('/chap').query({
                settings: { resource: 'systemSettings' },
            }),
        ).toEqual({ settings: { keyCalendar: 'gregory', keyUiLocale: 'en' } });
        await expect(
            createDataSource('/chap').query({
                data: { resource: 'analytics' },
            }),
        ).rejects.toThrow('optional DHIS2');
    });
    it('resolves dynamic query parameters and keeps Chap authentication out of DHIS2 requests', async () => {
        vi.stubGlobal('window', {
            location: { origin: 'https://app.example' },
        });
        const fetcher = vi.fn(
            async () =>
                new Response('{"id":"unit"}', {
                    headers: { 'Content-Type': 'application/json' },
                }),
        );
        vi.stubGlobal('fetch', fetcher);
        const source = createDataSource('/chap', 'https://dhis.example');
        await source.query(
            {
                unit: {
                    resource: 'organisationUnits',
                    id: (vars) => vars.id,
                    params: (vars) => ({ fields: vars.fields }),
                },
            },
            { variables: { id: 'unit', fields: 'id,displayName' } },
        );
        const [url, init] = (
            fetcher.mock.calls as unknown as [URL, RequestInit][]
        )[0];
        expect(url.pathname).toBe('/api/organisationUnits/unit');
        expect(url.searchParams.get('fields')).toBe('id,displayName');
        expect(init.credentials).toBe('include');
        expect(init.headers).toEqual({});
    });
});
