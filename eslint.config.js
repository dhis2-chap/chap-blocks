import tseslint from 'typescript-eslint';
import globals from 'globals';
export default tseslint.config({ ignores: ['**/generated/**', '**/dist/**', '**/locales/**', '**/docs/**', '**/public/**'] }, {
    files: ['**/*.{ts,tsx}'], languageOptions: { parser: tseslint.parser, globals: { ...globals.browser, ...globals.node } },
    plugins: { '@typescript-eslint': tseslint.plugin }, rules: { 'no-debugger': 'error', 'no-constant-condition': 'error' },
});
