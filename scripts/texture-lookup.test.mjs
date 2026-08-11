import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
    new URL('../src/rendering/textureLookup.ts', import.meta.url),
    'utf8'
);
const transpiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
    },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const { createTextureUrlLookup } = await import(moduleUrl);

test('texture URL lookup preserves first exact-name match and avoids repeated scans', () => {
    const lookup = createTextureUrlLookup([
        { name: 'car_body', url: '/textures/car-body.png' },
        { name: 'wheel', url: '/textures/wheel.png' },
        { name: 'car_body', url: '/textures/duplicate.png' },
    ]);

    assert.equal(lookup.get('car_body'), '/textures/car-body.png');
    assert.equal(lookup.get('wheel'), '/textures/wheel.png');
    assert.equal(lookup.get('missing'), undefined);
    assert.equal(lookup.size, 2);
});
