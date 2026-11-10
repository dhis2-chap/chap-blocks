import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['packages/**/*.test.ts', 'packages/**/*.test.tsx', 'api/**/*.test.ts', 'apps/**/*.test.ts', 'apps/**/*.test.tsx'], exclude: ['**/node_modules/**', '**/*.integration.test.ts'] } });
