import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { chapAppConfig } from '../../deploy/vite-app.config';

export default chapAppConfig({
    port: 5180,
    extend: {
        plugins: [
            mdx({
                providerImportSource: '@mdx-js/react',
                mdExtensions: [],
                mdxExtensions: ['.mdx', '.md'],
                remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
            }),
            react(),
        ],
        publicDir: '../../packages/modeling/public',
    },
});
