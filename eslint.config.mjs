import typescriptParser from '@typescript-eslint/parser';

export default [
    {
        ignores: ['.next/**', 'node_modules/**', 'data/source/**', 'src/resources/**'],
    },
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
            },
        },
    },
];
