import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const desktopSource = await readFile(
    new URL('../src/components/Menu/Desktop.tsx', import.meta.url),
    'utf8'
);
const mobileSource = await readFile(
    new URL('../src/components/Menu/Mobile/ModelList.tsx', import.meta.url),
    'utf8'
);
const pageSource = await readFile(new URL('../src/pages/index.tsx', import.meta.url), 'utf8');

test('catalog rows remain memoized and keyed by model id', () => {
    for (const source of [desktopSource, mobileSource]) {
        assert.match(source, /const CatalogRow = React\.memo/);
        assert.match(source, /keyExtractor=\{\(item\) => String\(item\.id\)\}/);
        assert.match(source, /accessibilityState=\{\{ selected \}\}/);
    }
    assert.match(
        pageSource,
        /const infoRows = useMemo\(\(\) => \(info \? getCatalogInfoRows\(info\) : \[\]\), \[info\]\);/
    );
    assert.equal((pageSource.match(/modelData=\{infoRows\}/g) ?? []).length, 1);
    assert.equal((pageSource.match(/data=\{infoRows\}/g) ?? []).length, 1);
});
