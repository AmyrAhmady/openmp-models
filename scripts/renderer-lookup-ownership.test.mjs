import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sceneSource = await readFile(new URL('../src/rendering/Scene.ts', import.meta.url), 'utf8');
const viewerSource = await readFile(
    new URL('../src/components/ModelViewer/index.tsx', import.meta.url),
    'utf8'
);

test('renderer infrastructure stays separate from the viewer DOM bridge', () => {
    assert.match(sceneSource, /private static readonly wheelDummies/);
    assert.match(sceneSource, /private static readonly specialColors/);
    assert.doesNotMatch(sceneSource, /\n\s+wheeldummies\s*:/);
    assert.doesNotMatch(sceneSource, /\n\s+SpecialColors\s*:/);
    assert.match(viewerSource, /from 'src\/rendering\/Scene'/);
    assert.match(viewerSource, /from 'src\/rendering\/types'/);
});
