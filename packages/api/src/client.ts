import { GeneratedChapClient } from './generated/GeneratedChapClient';
import type { OpenAPIConfig } from './generated/core/OpenAPI';

export type ChapConnection = {
    baseUrl: string;
    token?: OpenAPIConfig['TOKEN'];
    credentials?: RequestCredentials;
};

/** Each client owns its transport configuration. No global URL or token. */
export function createChapClient({
    baseUrl,
    token,
    credentials = 'omit',
}: ChapConnection) {
    const client = new GeneratedChapClient({
        BASE: baseUrl.replace(/\/$/, ''),
        TOKEN: token,
        WITH_CREDENTIALS: true,
        CREDENTIALS: credentials,
        ENCODE_PATH: encodeURIComponent,
    });
    // A service method may be passed directly to React Query as queryFn.
    for (const [key, service] of Object.entries(client)) {
        if (key === 'request') continue;
        for (const name of Object.getOwnPropertyNames(
            Object.getPrototypeOf(service),
        )) {
            if (name === 'constructor') continue;
            const method = Reflect.get(service, name);
            if (typeof method === 'function')
                Object.defineProperty(service, name, {
                    value: method.bind(service),
                });
        }
    }
    return client;
}
export type ChapClient = ReturnType<typeof createChapClient>;
