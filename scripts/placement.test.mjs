import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const typescriptBin = join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');

function compilePlacements(outputDirectory) {
    return new Promise((resolve, reject) => {
        const compiler = spawn(
            process.execPath,
            [
                typescriptBin,
                '--target',
                'es2020',
                '--module',
                'commonjs',
                '--lib',
                'dom,es2020',
                '--skipLibCheck',
                '--resolveJsonModule',
                '--esModuleInterop',
                '--rootDir',
                'src',
                '--outDir',
                outputDirectory,
                'src/domain/placementCatalog.ts',
                'src/domain/placementResponses.ts',
            ],
            { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] }
        );

        let output = '';
        compiler.stdout.on('data', (chunk) => {
            output += chunk.toString();
        });
        compiler.stderr.on('data', (chunk) => {
            output += chunk.toString();
        });
        compiler.on('error', reject);
        compiler.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`TypeScript test compilation failed:\n${output}`));
            }
        });
    });
}

async function loadModules() {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'omp-placements-'));
    await compilePlacements(outputDirectory);
    const load = (name) =>
        import(`${pathToFileURL(join(outputDirectory, 'domain', name)).href}?test=${Date.now()}`);
    const [catalog, responses] = await Promise.all([
        load('placementCatalog.js'),
        load('placementResponses.js'),
    ]);

    return {
        catalog,
        responses,
        cleanup: () => rm(outputDirectory, { recursive: true, force: true }),
    };
}

test('placement parser accepts an item and rejects malformed positions', async () => {
    const { responses, cleanup } = await loadModules();
    try {
        const item = {
            id: 1220,
            positions: [[2763.09375, 1449.9921875, 10.125]],
            interiors: [[2178.1953125, 1593.6328125, 1001.15625, 1]],
        };
        assert.deepEqual(responses.parsePlacementsResponse({ item }), { item });
        assert.throws(
            () =>
                responses.parsePlacementsResponse({
                    item: { ...item, positions: [[2763.09375, 1449.9921875]] },
                }),
            /Invalid placements response/
        );
        assert.throws(
            () =>
                responses.parsePlacementsResponse({
                    item: { ...item, interiors: [[2178.1953125, 1593.6328125, 1001.15625]] },
                }),
            /Invalid placements response/
        );
        assert.throws(() => responses.parsePlacementsResponse({}), /Invalid placements response/);
    } finally {
        await cleanup();
    }
});

test('map projection puts radar00 in the north-west corner', async () => {
    const { catalog, cleanup } = await loadModules();
    try {
        assert.deepEqual(catalog.worldToMap({ x: -3000, y: 3000 }, 1536), { x: 0, y: 0 });
        assert.deepEqual(catalog.worldToMap({ x: 3000, y: -3000 }, 1536), { x: 1536, y: 1536 });
        assert.deepEqual(catalog.worldToMap({ x: 0, y: 0 }, 1536), { x: 768, y: 768 });
        assert.deepEqual(catalog.mapToWorld({ x: 384, y: 1152 }, 1536), { x: -1500, y: -1500 });
        assert.equal(
            catalog.getRadarTileUrl(0),
            'https://assets.open.mp/models/exports/radar00.png'
        );
        assert.equal(
            catalog.getRadarTileUrl(143),
            'https://assets.open.mp/models/exports/radar143.png'
        );
    } finally {
        await cleanup();
    }
});
