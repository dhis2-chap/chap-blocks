import { defineConfig, loadEnv, type UserConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Shared Vite settings for the reference apps: React, the /chap-api development
 * proxy, map-library dependency hints and single React/query instances.
 */
export function chapAppConfig({ port, extend }: { port: number; extend?: Partial<UserConfig> }) {
    return defineConfig(({ mode }) => {
        const env = loadEnv(mode, process.cwd(), '');
        return {
            plugins: [react()],
            ...extend,
            server: {
                host: '127.0.0.1',
                port,
                strictPort: true,
                proxy: {
                    '/chap-api': {
                        target: env.CHAP_PROXY_TARGET || 'http://localhost:8000',
                        changeOrigin: true,
                        rewrite: (path: string) => path.replace(/^\/chap-api/, ''),
                    },
                },
            },
            preview: { host: '127.0.0.1', port },
            // Keep import.meta.url relative assets in the map library resolvable during development.
            optimizeDeps: {
                exclude: ['@dhis2/maps-gl'],
                include: [
                    '@turf/area', '@turf/bbox', '@turf/buffer', '@turf/center-of-mass', '@turf/circle', '@turf/length',
                    'comlink', 'uuid', 'maplibre-gl', '@mapbox/sphericalmercator', 'suggestions', 'fetch-jsonp',
                    'polylabel', 'lodash.throttle',
                ].map(dependency => `@chap-blocks/ui > @dhis2/maps-gl > ${dependency}`),
            },
            resolve: { dedupe: ['react', 'react-dom', '@tanstack/react-query'] },
        };
    });
}
