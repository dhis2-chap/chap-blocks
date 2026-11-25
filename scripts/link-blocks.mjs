#!/usr/bin/env node
/**
 * Makes chap-blocks packages importable in a repository that installs with npm or yarn 1. Those package managers
 * cannot read the `workspace:*` versions the packages use for each other, so the packages are not installed: this
 * script symlinks them into `node_modules/@chap-blocks/` and checks that the repository itself depends on their
 * third-party dependencies. pnpm repositories use workspaces instead (see the README).
 *
 * Run from the repository root, usually as a postinstall script:
 *   node vendor/chap-blocks/scripts/link-blocks.mjs ui runtime
 */
import { existsSync, lstatSync, mkdirSync, readdirSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCOPE = '@chap-blocks/';
const blocksRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const hostRoot = process.cwd();

const fail = message => {
    console.error(`link-blocks: ${message}`);
    process.exit(1);
};

const readJson = file => JSON.parse(readFileSync(file, 'utf8'));

const packages = new Map(
    readdirSync(join(blocksRoot, 'packages'))
        .filter(dir => existsSync(join(blocksRoot, 'packages', dir, 'package.json')))
        .map(dir => {
            const manifest = readJson(join(blocksRoot, 'packages', dir, 'package.json'));
            return [manifest.name, { dir: join(blocksRoot, 'packages', dir), manifest }];
        }),
);

const requested = process.argv.slice(2).map(name => (name.startsWith(SCOPE) ? name : SCOPE + name));
if (requested.length === 0) {
    fail(`name the packages you import, for example: link-blocks.mjs ui runtime\nAvailable: ${[...packages.keys()].join(', ')}`);
}
if (resolve(hostRoot) === blocksRoot) fail('run this from the repository that uses chap-blocks, not from chap-blocks itself.');
if (!existsSync(join(hostRoot, 'package.json'))) fail(`no package.json in ${hostRoot}; run this from your repository root.`);

const dependenciesOf = manifest => ({ ...manifest.dependencies, ...manifest.peerDependencies });

// The requested packages and the chap-blocks packages they depend on.
const linked = new Set();
const visit = name => {
    if (linked.has(name)) return;
    if (!packages.has(name)) fail(`unknown package ${name}. Available: ${[...packages.keys()].join(', ')}`);
    linked.add(name);
    Object.keys(dependenciesOf(packages.get(name).manifest)).filter(dep => dep.startsWith(SCOPE)).forEach(visit);
};
requested.forEach(visit);

for (const name of linked) {
    const target = join(hostRoot, 'node_modules', name);
    mkdirSync(dirname(target), { recursive: true });
    if (existsSync(target) || isSymlink(target)) {
        if (!isSymlink(target)) console.warn(`link-blocks: replacing ${relative(hostRoot, target)}, which was not a link to chap-blocks`);
        rmSync(target, { recursive: true, force: true });
    }
    symlinkSync(relative(dirname(target), packages.get(name).dir), target, 'junction');
}

// Imports from the linked source resolve to your node_modules, so your package.json must provide these.
const host = readJson(join(hostRoot, 'package.json'));
const declared = { ...host.devDependencies, ...host.dependencies };
const required = new Map();
for (const name of linked) {
    for (const [dep, range] of Object.entries(dependenciesOf(packages.get(name).manifest))) {
        if (!dep.startsWith(SCOPE)) required.set(dep, range);
    }
}
const problems = [];
for (const [dep, range] of [...required].sort(([a], [b]) => a.localeCompare(b))) {
    const manifestFile = join(hostRoot, 'node_modules', dep, 'package.json');
    if (!(dep in declared)) problems.push({ dep, range, reason: 'not in your package.json' });
    else if (!existsSync(manifestFile)) problems.push({ dep, range, reason: 'not installed' });
    else if (!satisfies(readJson(manifestFile).version, range)) {
        problems.push({ dep, range, reason: `installed ${readJson(manifestFile).version}` });
    }
}

if (problems.length > 0) {
    const add = /^yarn/.test(process.env.npm_config_user_agent ?? '') || existsSync(join(hostRoot, 'yarn.lock')) ? 'yarn add' : 'npm install';
    fail(
        `linked ${[...linked].join(', ')}, but they need these dependencies in your package.json:\n` +
            problems.map(({ dep, range, reason }) => `  ${dep}@${range} (${reason})`).join('\n') +
            `\nRun: ${add} ${problems.map(({ dep, range }) => `"${dep}@${range}"`).join(' ')}`,
    );
}
console.log(`link-blocks: linked ${[...linked].join(', ')}`);

function isSymlink(path) {
    try {
        return lstatSync(path).isSymbolicLink();
    } catch {
        return false;
    }
}

/** Enough of semver for the ranges chap-blocks uses: exact, ^, ~, >= and *. Anything else is accepted. */
function satisfies(version, range) {
    const parse = text => text.replace(/^[v=]/, '').split(/[-+]/)[0].split('.').map(Number);
    const compare = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
    const match = /^(\^|~|>=)?\s*(\d+\.\d+\.\d+)$/.exec(range.trim());
    if (range.trim() === '*' || range.trim() === '') return true;
    if (!match) return true;
    const [have, want] = [parse(version), parse(match[2])];
    if (have.some(Number.isNaN)) return true;
    if (compare(have, want) < 0) return false;
    if (match[1] === '>=') return true;
    if (match[1] === '~') return have[0] === want[0] && have[1] === want[1];
    if (match[1] === '^') return want[0] > 0 ? have[0] === want[0] : have[1] === want[1] && (want[1] > 0 || have[2] === want[2]);
    return compare(have, want) === 0;
}
