type Variables = Record<string, any>;
type Dynamic<T> = T | ((variables: Variables) => T);
export type ResourceQuery = {
    resource: string;
    id?: Dynamic<string | number>;
    params?: Dynamic<Record<string, unknown>>;
};
type QueryOptions = { variables?: Variables; onError?: (error: any) => void };
export type Mutation = ResourceQuery & { type: string; data?: unknown };
export type DataSource = {
    query: (
        queries: Record<string, ResourceQuery>,
        options?: QueryOptions,
    ) => Promise<Record<string, unknown>>;
    mutate: (mutation: Mutation) => Promise<unknown>;
};

/** Browser settings are scoped to a Chap server. Optional DHIS2 requests use its own origin. */
export function createDataSource(
    chapUrl: string,
    dhis2Url?: string,
    storage?: Storage,
): DataSource {
    async function request(
        query: ResourceQuery,
        method = 'GET',
        body?: unknown,
    ): Promise<unknown> {
        const { resource } = query;
        const id = typeof query.id === 'function' ? query.id({}) : query.id;
        const params =
            typeof query.params === 'function'
                ? query.params({})
                : query.params;
        if (resource.startsWith('dataStore/modeling/')) {
            if (!storage)
                throw new Error('Browser settings storage is unavailable.');
            const key = `chap-blocks:${chapUrl}:${resource}`;
            if (method !== 'GET') {
                if (method === 'DELETE') storage.removeItem(key);
                else storage.setItem(key, JSON.stringify(body));
                return { status: 'OK' };
            }
            const value = storage.getItem(key);
            if (value === null)
                throw Object.assign(new Error('Setting not found'), {
                    details: { httpStatusCode: 404 },
                });
            return JSON.parse(value);
        }
        if (resource === 'systemSettings' && !dhis2Url)
            return { keyCalendar: 'gregory', keyUiLocale: 'en' };
        if (!dhis2Url)
            throw new Error(
                'Connect an optional DHIS2 data source in Settings to use this feature.',
            );
        const url = new URL(
            `${dhis2Url.replace(/\/$/, '')}/api/${resource.replace(/^\.\.\//, '')}${id ? `/${encodeURIComponent(id)}` : ''}`,
            window.location.origin,
        );
        Object.entries(params ?? {}).forEach(([key, value]) => {
            if (value != null)
                url.searchParams.set(
                    key,
                    Array.isArray(value) ? value.join(',') : String(value),
                );
        });
        const response = await fetch(url, {
            method,
            credentials: 'include',
            headers:
                body === undefined
                    ? {}
                    : { 'Content-Type': 'application/json' },
            body: body === undefined ? undefined : JSON.stringify(body),
        });
        if (!response.ok) {
            const body = await response.json().catch(() => undefined);
            const message =
                body && typeof body.message === 'string'
                    ? body.message
                    : `DHIS2 request failed (${response.status})`;
            throw Object.assign(new Error(message), {
                details: { httpStatusCode: response.status, response: body },
            });
        }
        return response.status === 204 ? null : response.json();
    }
    return {
        query: async (queries, options = {}) => {
            try {
                return Object.fromEntries(
                    await Promise.all(
                        Object.entries(queries).map(async ([key, query]) => [
                            key,
                            await request({
                                ...query,
                                id:
                                    typeof query.id === 'function'
                                        ? query.id(options.variables ?? {})
                                        : query.id,
                                params:
                                    typeof query.params === 'function'
                                        ? query.params(options.variables ?? {})
                                        : query.params,
                            }),
                        ]),
                    ),
                );
            } catch (error) {
                options.onError?.(error);
                throw error;
            }
        },
        mutate: (mutation) =>
            request(
                mutation,
                (
                    {
                        create: 'POST',
                        update: 'PUT',
                        delete: 'DELETE',
                    } as Record<string, string>
                )[mutation.type] ?? 'POST',
                mutation.data,
            ),
    };
}
