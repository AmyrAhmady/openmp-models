import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const domainSource = await readFile(
    new URL('../src/domain/catalogInfo.ts', import.meta.url),
    'utf8'
);
const pageSource = await readFile(new URL('../src/pages/index.tsx', import.meta.url), 'utf8');

test('catalog info labels and row mapping stay in the domain boundary', () => {
    assert.match(domainSource, /export function getCatalogInfoRows\(item: CatalogItem\)/);
    assert.match(domainSource, /infoLabels\[key\] \?\? 'Unknown info'/);
    assert.match(pageSource, /import \{ getCatalogInfoRows \} from 'src\/domain\/catalogInfo';/);
    assert.doesNotMatch(pageSource, /realNames|getInfoRows/);
});
