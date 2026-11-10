import { useCallback, useEffect, useState } from 'react';

/** View state lives in the hash (`#/setup/1?region=…&period=…&approved=1`) so links can be shared from a static host. */
export type ViewState = { setup?: number; region?: string; period?: string; approvedOnly: boolean };

const read = (): ViewState => {
    const [path, search = ''] = window.location.hash.replace(/^#\/?/, '').split('?');
    const match = path.match(/^setup\/(\d+)/);
    const params = new URLSearchParams(search);
    return {
        setup: match ? Number(match[1]) : undefined,
        region: params.get('region') || undefined,
        period: params.get('period') || undefined,
        approvedOnly: params.get('approved') === '1',
    };
};

const write = (state: ViewState) => {
    const params = new URLSearchParams();
    if (state.region) params.set('region', state.region);
    if (state.period) params.set('period', state.period);
    if (state.approvedOnly) params.set('approved', '1');
    const query = params.toString();
    return `#/${state.setup !== undefined ? `setup/${state.setup}` : ''}${query ? `?${query}` : ''}`;
};

export const useHashState = () => {
    const [state, setState] = useState(read);
    useEffect(() => {
        const onChange = () => setState(read());
        window.addEventListener('hashchange', onChange);
        window.addEventListener('popstate', onChange);
        return () => {
            window.removeEventListener('hashchange', onChange);
            window.removeEventListener('popstate', onChange);
        };
    }, []);
    const update = useCallback((patch: Partial<ViewState>, options: { replace?: boolean } = {}) => {
        const next = write({ ...read(), ...patch });
        if (next === window.location.hash) return;
        if (options.replace) window.history.replaceState(null, '', next);
        else window.history.pushState(null, '', next);
        setState(read());
    }, []);
    return [state, update] as const;
};
