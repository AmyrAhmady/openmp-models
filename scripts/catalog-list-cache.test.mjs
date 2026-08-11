import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(
    new URL('../src/catalog/catalogListCache.ts', import.meta.url),
    'utf8'
);
const transpiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
    },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const { cacheCatalogList, clearCatalogListCache, getCachedCatalogList, getOrLoadCatalogList } =
    await import(moduleUrl);

test('catalog list cache shares successful lists by model type and can be cleared', () => {
    clearCatalogListCache();
    const vehicles = [{ id: 400, name: 'Landstalker', model: 'landstal' }];
    const skins = [{ id: 1, name: 'CJ', model: 'cj' }];

    assert.equal(getCachedCatalogList('vehicle'), undefined);
    cacheCatalogList('vehicle', vehicles);
    cacheCatalogList('skin', skins);

    assert.strictEqual(getCachedCatalogList('vehicle'), vehicles);
    assert.strictEqual(getCachedCatalogList('skin'), skins);
    assert.equal(getCachedCatalogList('object'), undefined);

    clearCatalogListCache();
    assert.equal(getCachedCatalogList('vehicle'), undefined);
    assert.equal(getCachedCatalogList('skin'), undefined);
});

test('catalog list cache deduplicates in-flight loads and aborts consumers independently', async () => {
    clearCatalogListCache();
    let loadCount = 0;
    let resolveLoad;
    const load = () => {
        loadCount += 1;
        return new Promise((resolve) => {
            resolveLoad = resolve;
        });
    };
    const firstController = new AbortController();
    const secondController = new AbortController();
    const firstRequest = getOrLoadCatalogList('vehicle', load, firstController.signal);
    const secondRequest = getOrLoadCatalogList('vehicle', load, secondController.signal);

    assert.equal(loadCount, 1);
    firstController.abort();
    await assert.rejects(firstRequest, (error) => error.name === 'AbortError');

    const vehicles = [{ id: 400, name: 'Landstalker', model: 'landstal' }];
    resolveLoad(vehicles);
    assert.deepEqual(await secondRequest, vehicles);
    assert.strictEqual(getCachedCatalogList('vehicle'), vehicles);
    clearCatalogListCache();
});
