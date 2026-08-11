import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const pageSource = await readFile(new URL('../src/pages/index.tsx', import.meta.url), 'utf8');
const modelStageSource = await readFile(
    new URL('../src/components/ModelStage/index.tsx', import.meta.url),
    'utf8'
);
const selectionHookSource = await readFile(
    new URL('../src/hooks/useModelSelection.ts', import.meta.url),
    'utf8'
);

test('model type changes cancel stale loads and avoid cross-catalog selection', () => {
    assert.match(
        selectionHookSource,
        /useState<ModelType \| null>\('vehicle'\)/,
        'selection type must be nullable while a new catalog is active'
    );
    assert.match(selectionHookSource, /selectedItemAbortController\.current\?\.abort\(\);/);
    assert.match(selectionHookSource, /modelLoadAbortController\.current\?\.abort\(\);/);
    assert.match(selectionHookSource, /setSelectedModelType\(null\);/);
    assert.match(selectionHookSource, /setModels\(\[\]\);/);
    assert.match(selectionHookSource, /setModelStatus\('idle'\);/);
    assert.match(
        selectionHookSource,
        /if \(!info \|\| selectedModelType !== modelType\) \{\s*return;\s*\}/
    );
    assert.match(selectionHookSource, /useState<CatalogItem \| null>\(initialInfo\)/);
    assert.match(selectionHookSource, /setInfo\(null\);/);
    assert.match(pageSource, /useModelSelection\(modelType\)/);
    assert.match(pageSource, /setModelType\(type\.value\);/);
    assert.match(pageSource, /info \? getCatalogInfoRows\(info\) : \[\]/);
    assert.match(modelStageSource, /info\?\.name \?\? 'Choose a model'/);
    assert.match(modelStageSource, /modelStatus === 'idle'/);
    assert.match(modelStageSource, /Preparing preview/);
    assert.match(modelStageSource, /Select a model from the catalog to preview it here\./);
    assert.equal(
        (pageSource.match(/selectedModelType === modelType && info \? info\.id : -1/g) ?? [])
            .length,
        2
    );
});
