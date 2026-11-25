import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const blocksRoot = resolve(__dirname, '../..');
const script = join(blocksRoot, 'scripts/link-blocks.mjs');
const manifest = (dir: string) => JSON.parse(readFileSync(join(blocksRoot, 'packages', dir, 'package.json'), 'utf8'));

/** Third-party dependencies of ui and the chap-blocks packages it uses. */
const uiDependencies = (): Record<string, string> => {
    const all = ['ui', 'core', 'api'].map(manifest).map(m => ({ ...m.dependencies, ...m.peerDependencies }));
    return Object.fromEntries(
        all.flatMap(deps => Object.entries(deps) as [string, string][]).filter(([name]) => !name.startsWith('@chap-blocks/')),
    );
};

/** A version that satisfies the ranges chap-blocks uses. */
const versionFor = (range: string) => range.replace(/^[\^~]|^>=/, '');

let host: string;

const run = (...packages: string[]) => {
    const result = spawnSync(process.execPath, [script, ...packages], { cwd: host, encoding: 'utf8', env: { ...process.env, npm_config_user_agent: 'npm/11' } });
    return { status: result.status, output: result.stdout + result.stderr };
};

const install = (deps: Record<string, string>, declare = true) => {
    for (const [name, version] of Object.entries(deps)) {
        mkdirSync(join(host, 'node_modules', name), { recursive: true });
        writeFileSync(join(host, 'node_modules', name, 'package.json'), JSON.stringify({ name, version }));
    }
    const pkg = JSON.parse(readFileSync(join(host, 'package.json'), 'utf8'));
    if (declare) pkg.dependencies = { ...pkg.dependencies, ...Object.fromEntries(Object.keys(deps).map(name => [name, '*'])) };
    writeFileSync(join(host, 'package.json'), JSON.stringify(pkg));
};

const linkTarget = (name: string) => realpathSync(join(host, 'node_modules/@chap-blocks', name));

beforeEach(() => {
    host = mkdtempSync(join(tmpdir(), 'link-blocks-'));
    writeFileSync(join(host, 'package.json'), JSON.stringify({ name: 'host', private: true }));
});

afterEach(() => rmSync(host, { recursive: true, force: true }));

describe('link-blocks', () => {
    it('links the requested package and the chap-blocks packages it depends on', () => {
        install(Object.fromEntries(Object.entries(uiDependencies()).map(([name, range]) => [name, versionFor(range)])));

        const { status, output } = run('ui');

        expect(output).toContain('linked @chap-blocks/ui, @chap-blocks/core, @chap-blocks/api');
        expect(status).toBe(0);
        expect(linkTarget('ui')).toBe(realpathSync(join(blocksRoot, 'packages/ui')));
        expect(linkTarget('api')).toBe(realpathSync(join(blocksRoot, 'packages/api')));
        expect(existsSync(join(host, 'node_modules/@chap-blocks/modeling'))).toBe(false);
    });

    it('fails with an install command when the repository does not provide a dependency', () => {
        const deps = Object.fromEntries(Object.entries(uiDependencies()).map(([name, range]) => [name, versionFor(range)]));
        delete deps['date-fns'];
        install(deps);
        install({ zod: '3.23.8' }, false);
        const pkg = JSON.parse(readFileSync(join(host, 'package.json'), 'utf8'));
        delete pkg.dependencies.zod;
        writeFileSync(join(host, 'package.json'), JSON.stringify(pkg));

        const { status, output } = run('ui');

        expect(status).toBe(1);
        expect(output).toContain(`date-fns@${uiDependencies()['date-fns']} (not in your package.json)`);
        expect(output).toContain('zod@'); // installed by something else, but not declared
        expect(output).toMatch(/Run: npm install .*"date-fns@/);
        expect(lstatSync(join(host, 'node_modules/@chap-blocks/ui')).isSymbolicLink()).toBe(true);
    });

    it('reports an installed version outside the range', () => {
        install(Object.fromEntries(Object.entries(uiDependencies()).map(([name, range]) => [name, versionFor(range)])));
        install({ 'date-fns': '3.6.0' });

        const { status, output } = run('ui');

        expect(status).toBe(1);
        expect(output).toContain('(installed 3.6.0)');
    });

    it('replaces a package of the same name that is not a link', () => {
        install(Object.fromEntries(Object.entries(manifest('core').dependencies as Record<string, string>).map(([n, r]) => [n, versionFor(r)])));
        mkdirSync(join(host, 'node_modules/@chap-blocks/core'), { recursive: true });
        writeFileSync(join(host, 'node_modules/@chap-blocks/core/package.json'), '{"name":"@chap-blocks/core","version":"9.9.9"}');

        const { status, output } = run('@chap-blocks/core');

        expect(status).toBe(0);
        expect(output).toContain('was not a link to chap-blocks');
        expect(linkTarget('core')).toBe(realpathSync(join(blocksRoot, 'packages/core')));
    });

    it('rejects unknown packages and a missing argument', () => {
        expect(run('nope').output).toContain('unknown package @chap-blocks/nope');
        expect(run().status).toBe(1);
    });
});
