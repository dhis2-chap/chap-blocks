import { chapAppConfig } from '../../deploy/vite-app.config';

// Relative asset URLs: the gallery is served at a subpath on chap-sandbox
// (/blocks/) and at /blocks-demo/ on Vercel preview URLs.
export default chapAppConfig({ port: 5181, extend: { base: './' } });
