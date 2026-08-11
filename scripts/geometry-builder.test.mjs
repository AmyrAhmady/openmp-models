import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const sourcePath = new URL('../src/rendering/geometryBuilder.ts', import.meta.url);
const source = await readFile(sourcePath, 'utf8');
const transpiled = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
    },
}).outputText;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transpiled).toString('base64')}`;
const { buildIndexedGeometry } = await import(moduleUrl);

const squareGeometry = {
    facetype: 'Triangles',
    vertices: [
        { x: 0, y: 0, z: 0 },
        { x: 1, y: 0, z: 0 },
        { x: 1, y: 1, z: 0 },
        { x: 0, y: 1, z: 0 },
    ],
    texcoords: [
        { uvx: 0, uvy: 0 },
        { uvx: 1, uvy: 0 },
        { uvx: 1, uvy: 1 },
        { uvx: 0, uvy: 1 },
    ],
    textures: [{ color: [255, 255, 255, 255], name: 'square', indices: [0, 1, 2, 0, 2, 3] }],
};

test('geometry builder deduplicates indexed triangles', () => {
    const indexedSquare = buildIndexedGeometry(squareGeometry);
    assert.equal(indexedSquare.positions.length, 12);
    assert.deepEqual(indexedSquare.indices, [0, 1, 2, 0, 2, 3]);
    assert.deepEqual(indexedSquare.groups, [{ start: 0, count: 6, materialIndex: 0 }]);
});

test('geometry builder preserves triangle-strip winding', () => {
    const strip = buildIndexedGeometry({
        ...squareGeometry,
        facetype: 'Triangle_Strip',
        textures: [{ ...squareGeometry.textures[0], indices: [0, 1, 2, 3] }],
    });
    assert.deepEqual(strip.indices, [0, 1, 2, 1, 3, 2]);
    assert.equal(strip.positions.length, 12);
});
