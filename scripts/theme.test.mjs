import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/theme/themeTokens.ts', import.meta.url), 'utf8');
const controllerSource = await readFile(
    new URL('../src/hooks/useThemeController.ts', import.meta.url),
    'utf8'
);
const pageSource = await readFile(new URL('../src/pages/index.tsx', import.meta.url), 'utf8');
const contextSource = await readFile(
    new URL('../src/theme/ThemeContext.tsx', import.meta.url),
    'utf8'
);
const transpiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
    },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const { backgroundForTheme, themeSelect } = await import(moduleUrl);

test('theme selector returns stable typed light and dark token sets', () => {
    const light = themeSelect('light');
    const dark = themeSelect('dark');

    assert.equal(light.mainBg, '#f5f7fb');
    assert.equal(dark.mainBg, '#10141d');
    assert.notEqual(light.mainBg, dark.mainBg);
    assert.equal(typeof light.accent, 'string');
    assert.equal(typeof dark.accent, 'string');
});

test('theme changes preserve custom background selections', () => {
    const themeSelection = { color: lightColor(), source: 'theme' };
    const darkSelection = backgroundForTheme('dark', themeSelection);
    assert.deepEqual(darkSelection, { color: '#10141d', source: 'theme' });

    const customSelection = { color: '#ff00aa', source: 'custom' };
    assert.strictEqual(backgroundForTheme('dark', customSelection), customSelection);
    assert.strictEqual(backgroundForTheme('light', customSelection), customSelection);
});

test('theme persistence and background transitions have one page-facing owner', () => {
    assert.match(controllerSource, /readThemeMode\(\)/);
    assert.match(controllerSource, /writeThemeMode\(nextThemeMode\)/);
    assert.match(controllerSource, /backgroundForTheme\(nextThemeMode, currentSelection\)/);
    assert.match(pageSource, /useThemeController\(\)/);
    assert.doesNotMatch(pageSource, /readThemeMode|writeThemeMode|backgroundForTheme/);
});

test('theme context keeps ReactNode as a type-only import', () => {
    assert.match(contextSource, /import type \{ ReactNode \} from 'react'/);
    assert.doesNotMatch(contextSource, /import React, \{[^}]*ReactNode/);
});

function lightColor() {
    return themeSelect('light').mainBg;
}
