import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, createChapClient } from '../index';

afterEach(() => vi.unstubAllGlobals());
const json = (value: unknown, status = 200) => new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });

describe('isolated Chap clients', () => {
    it('keeps URLs and bearer tokens separate, including unbound query functions', async () => {
        const fetcher = vi.fn(async () => json([]));
        vi.stubGlobal('fetch', fetcher);
        const first = createChapClient({ baseUrl: 'https://one.example/', token: 'first-token' });
        const second = createChapClient({ baseUrl: 'https://two.example', token: 'second-token' });
        const queryFn = first.datasets.getDatasetsV1CrudDatasetsGet;
        await Promise.all([queryFn(), second.datasets.getDatasetsV1CrudDatasetsGet()]);
        const calls = fetcher.mock.calls as unknown as [string, RequestInit][];
        expect(calls.map(([url]) => url)).toEqual(['https://one.example/v1/crud/datasets', 'https://two.example/v1/crud/datasets']);
        expect(calls.map(([, init]) => (init.headers as Headers).get('Authorization'))).toEqual(['Bearer first-token', 'Bearer second-token']);
        expect(calls.every(([, init]) => init.credentials === 'omit')).toBe(true);
    });

    it('preserves structured 401 and validation errors', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => json({ detail: 'Token required' }, 401)));
        const client = createChapClient({ baseUrl: '/chap-api' });
        await expect(client.system.systemInfoSystemInfoGet()).rejects.toMatchObject({ status: 401, body: { detail: 'Token required' } });
        vi.stubGlobal('fetch', vi.fn(async () => json({ detail: [{ loc: ['body', 'name'], msg: 'Required' }] }, 422)));
        await expect(client.datasets.getDatasetsV1CrudDatasetsGet()).rejects.toBeInstanceOf(ApiError);
    });

    it('uploads binary CSV and GeoJSON without forcing a multipart boundary', async () => {
        const fetcher = vi.fn(async () => json({ id: 7 }));
        vi.stubGlobal('fetch', fetcher);
        const csv = new File(['time_period,location\n2024-01,Demo'], 'data.csv', { type: 'text/csv' });
        const geometry = new File(['{"type":"FeatureCollection","features":[]}'], 'regions.geojson');
        await createChapClient({ baseUrl: '/chap-api' }).datasets.createDatasetCsvV1CrudDatasetsCsvFilePost({ csv_file: csv, geojson_file: geometry });
        const [, init] = (fetcher.mock.calls as unknown as [string, RequestInit][])[0];
        expect(init.body).toBeInstanceOf(FormData);
        expect(await (init.body as FormData).get('csv_file')!.toString()).toBe('[object File]');
        expect((init.headers as Headers).has('Content-Type')).toBe(false);
        expect(await ((init.body as FormData).get('csv_file') as File).text()).toContain('2024-01,Demo');
    });

    it('uses authentication for CSV exports too', async () => {
        const fetcher = vi.fn(async () => new Response('period,value\n2024-01,3', { headers: { 'Content-Type': 'text/csv' } }));
        vi.stubGlobal('fetch', fetcher);
        const result = await createChapClient({ baseUrl: '/chap-api', token: 'private' }).datasets.getDatasetCsvV1CrudDatasetsDatasetIdCsvGet(7);
        expect(result).toContain('2024-01,3');
        const [url, init] = (fetcher.mock.calls as unknown as [string, RequestInit][])[0];
        expect(url).toBe('/chap-api/v1/crud/datasets/7/csv');
        expect((init.headers as Headers).get('Authorization')).toBe('Bearer private');
    });
});
