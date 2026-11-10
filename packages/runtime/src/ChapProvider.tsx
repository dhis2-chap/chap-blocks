import {
    createContext,
    useContext,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { createChapClient, type ChapConnection } from '@chap-blocks/api';
import {
    QueryClient,
    QueryClientProvider,
    useMutation,
    useQuery,
} from '@tanstack/react-query';
import { createDataSource } from './data-source';

export type Connection = ChapConnection & { dhis2Url?: string };
type Notice = { id: number; message: string; critical?: boolean };
function createRuntime(
    connection: Connection,
    token: Connection['token'],
    notify: (message: string, critical?: boolean) => void,
) {
    return {
        connection,
        client: createChapClient({ ...connection, token }),
        dataSource: createDataSource(
            connection.baseUrl,
            connection.dhis2Url,
            typeof window !== 'undefined' ? window.localStorage : undefined,
        ),
        notify,
    };
}
const Context = createContext<ReturnType<typeof createRuntime> | null>(null);

/** Owns a server-scoped query cache, data source and notification surface. */
export function ChapProvider({
    connection,
    children,
}: {
    connection: Connection;
    children: ReactNode;
}) {
    const [notices, setNotices] = useState<Notice[]>([]);
    // Inline connection objects and token functions are new on every render. Read the
    // latest token through a ref so they do not rebuild the client or drop the cache.
    const latest = useRef(connection);
    latest.current = connection;
    const { baseUrl, credentials, dhis2Url } = connection;
    // A changed token string may grant different access, so it gets a fresh cache.
    const tokenKey =
        typeof connection.token === 'function' ? 'function' : connection.token;
    const queryClient = useMemo(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: { retry: false, refetchOnWindowFocus: false },
                },
            }),
        [baseUrl, tokenKey, credentials, dhis2Url],
    );
    const runtime = useMemo(
        () =>
            createRuntime(
                latest.current,
                async (options) => {
                    const { token } = latest.current;
                    return (
                        (typeof token === 'function'
                            ? await token(options)
                            : token) ?? ''
                    );
                },
                (message, critical) =>
                    setNotices((items) => [
                        ...items,
                        { id: Date.now() + Math.random(), message, critical },
                    ]),
            ),
        [baseUrl, tokenKey, credentials, dhis2Url],
    );
    return (
        <Context.Provider value={runtime}>
            <QueryClientProvider client={queryClient}>
                {children}
                <div
                    aria-live="polite"
                    style={{
                        position: 'fixed',
                        bottom: 20,
                        right: 20,
                        zIndex: 10000,
                        display: 'grid',
                        gap: 8,
                    }}
                >
                    {notices.map((notice) => (
                        <div
                            role={notice.critical ? 'alert' : 'status'}
                            key={notice.id}
                            style={{
                                padding: 16,
                                background: notice.critical
                                    ? '#fff0f0'
                                    : '#edf9f1',
                                color: '#172a3a',
                                border: '1px solid #ccd7df',
                                borderRadius: 6,
                                maxWidth: 440,
                            }}
                        >
                            {notice.message}{' '}
                            <button
                                aria-label="Dismiss notification"
                                onClick={() =>
                                    setNotices((items) =>
                                        items.filter(
                                            (item) => item.id !== notice.id,
                                        ),
                                    )
                                }
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </QueryClientProvider>
        </Context.Provider>
    );
}
function useRuntime() {
    const value = useContext(Context);
    if (!value) throw new Error('Wrap this feature in ChapProvider.');
    return value;
}
export const useChapClient = () => useRuntime().client;
export const useConnection = () => useRuntime().connection;
export const useDataEngine = () => useRuntime().dataSource;
export function useAlert(
    message: string,
    options: {
        critical?: boolean;
        success?: boolean;
        warning?: boolean;
        duration?: number;
        permanent?: boolean;
    } = {},
) {
    const { notify } = useRuntime();
    return { show: () => notify(message, options.critical) };
}
export function useConfig() {
    const { connection } = useRuntime();
    return {
        baseUrl: connection.dhis2Url ?? '',
        appVersion: { full: '0.1.0' },
        serverVersion: undefined as { full: string } | undefined,
        systemInfo: undefined as { version: string } | undefined,
    };
}
export function useDataMutation(
    mutation: Parameters<ReturnType<typeof useDataEngine>['mutate']>[0],
) {
    const engine = useDataEngine();
    const result = useMutation({ mutationFn: () => engine.mutate(mutation) });
    return [
        result.mutateAsync,
        {
            loading: result.isLoading,
            error: result.error,
            called: !result.isIdle,
        },
    ] as const;
}
// Kept for the extracted feature hooks; a connection replaces DHIS2's route lookup.
export function useRoute() {
    const connection = useConnection();
    return {
        route: { url: connection.baseUrl, id: connection.baseUrl },
        error: null,
        isLoading: false,
        isError: false,
    };
}
export function useChapStatus(_options?: unknown) {
    const client = useChapClient();
    const connection = useConnection();
    const result = useQuery({
        queryKey: ['systemInfo', connection.baseUrl],
        queryFn: () => client.system.systemInfoSystemInfoGet(),
        staleTime: 300000,
    });
    return {
        status: result.data,
        error: result.error,
        isLoading: result.isLoading,
    };
}
