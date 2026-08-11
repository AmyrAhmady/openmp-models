import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const patterns = ['src/**/*.{ts,tsx}', 'scripts/**/*.mjs', '*.{json,mjs,js}', '.github/**/*.yml'];

const prettierCommand =
    process.platform === 'win32'
        ? resolve('node_modules/.bin/prettier.cmd')
        : resolve('node_modules/.bin/prettier');

execFileSync(prettierCommand, ['--check', ...patterns], {
    shell: process.platform === 'win32',
    stdio: 'inherit',
});
