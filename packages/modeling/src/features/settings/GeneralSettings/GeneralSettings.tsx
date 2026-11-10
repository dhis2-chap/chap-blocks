import { useState } from 'react';
import { useConnection, useChapStatus } from '@chap-blocks/runtime';
import { Button, Card, NoticeBox } from '@dhis2/ui';

export const CONNECTION_KEY = 'chap-blocks:connection';
export const TOKEN_KEY = 'chap-blocks:token';
export function GeneralSettings() {
    const connection = useConnection();
    const [baseUrl, setBaseUrl] = useState(connection.baseUrl);
    const [token, setToken] = useState(typeof connection.token === 'string' ? connection.token : '');
    const [dhis2Url, setDhis2Url] = useState(connection.dhis2Url ?? '');
    const [error, setError] = useState('');
    const { status } = useChapStatus();
    function save(event: React.FormEvent) {
        event.preventDefault();
        try {
            for (const value of [baseUrl, dhis2Url].filter(Boolean)) {
                const url = new URL(value, location.origin);
                if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) throw new Error('Use an HTTP(S) URL or a path such as /chap-api, without credentials, query or fragment.');
            }
            localStorage.setItem(CONNECTION_KEY, JSON.stringify({ baseUrl: baseUrl.replace(/\/$/, ''), dhis2Url: dhis2Url.replace(/\/$/, '') || undefined }));
            if (token) sessionStorage.setItem(TOKEN_KEY, token); else sessionStorage.removeItem(TOKEN_KEY);
            location.reload();
        } catch (error) { setError(error instanceof Error ? error.message : String(error)); }
    }
    return <Card><form onSubmit={save} style={{ padding: 28, display: 'grid', gap: 20, maxWidth: 760 }}>
        <h2>Chap connection</h2><p>Use /chap-api to connect through this site's proxy, which supplies the host's shared credentials when no token is entered. To use your own access, enter a token, or a Chap Core URL together with its token. In development, /chap-api is proxied to localhost:8000.</p>
        <label>Chap API URL<input required value={baseUrl} onChange={e => setBaseUrl(e.target.value)} /></label>
        <label>API bearer token (this browser session only)<input type="password" autoComplete="off" value={token} onChange={e => setToken(e.target.value)} /></label>
        <label>Optional DHIS2 URL<input value={dhis2Url} onChange={e => setDhis2Url(e.target.value)} placeholder="https://your-dhis2.example.org" /></label>
        <p>DHIS2 is needed only for its organisation units, analytics, data import/export and maintenance. It uses your existing DHIS2 browser session and requires cross-origin access when hosted separately.</p>
        {status && <NoticeBox title="Connected">Chap Core {status.chap_core_version}</NoticeBox>}
        {error && <NoticeBox error title="Connection settings">{error}</NoticeBox>}
        <Button primary type="submit">Save connection</Button>
    </form></Card>;
}
