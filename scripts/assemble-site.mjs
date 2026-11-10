// Combines every app build into site/<app>/ for the single Vercel deployment.
// vercel.json maps each subdomain to its folder; see docs/deployment.md.
import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const site = new URL('site/', root);
await rm(site, { recursive: true, force: true });
await mkdir(site);
for (const app of await readdir(new URL('apps/', root))) {
    const dist = new URL(`apps/${app}/dist/`, root);
    if (!(await stat(dist).catch(() => null))?.isDirectory()) continue;
    await cp(dist, new URL(`${app}/`, site), { recursive: true });
    console.log(`site/${app}`);
}
