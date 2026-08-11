import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(new URL('../src/pages/index.tsx', import.meta.url), 'utf8');
const desktopSource = await readFile(
    new URL('../src/components/Menu/Desktop.tsx', import.meta.url),
    'utf8'
);
const mobileSource = await readFile(
    new URL('../src/components/Menu/Mobile/index.tsx', import.meta.url),
    'utf8'
);
const mobileModelListSource = await readFile(
    new URL('../src/components/Menu/Mobile/ModelList.tsx', import.meta.url),
    'utf8'
);

test('desktop and mobile menus receive one page-owned catalog query', () => {
    assert.match(pageSource, /const catalogQuery = useCatalogQuery\(modelType\);/);
    assert.equal((pageSource.match(/catalogQuery=\{catalogQuery\}/g) ?? []).length, 2);

    for (const menuSource of [desktopSource, mobileSource]) {
        assert.match(menuSource, /catalogQuery: UseCatalogQueryResult;/);
        assert.doesNotMatch(menuSource, /useCatalogQuery\(/);
    }

    assert.match(mobileSource, /searchInput=\{catalogQuery\.searchInput\}/);
    assert.match(mobileModelListSource, /value=\{searchInput\}/);
    assert.doesNotMatch(mobileModelListSource, /useState\(/);
});
