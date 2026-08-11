import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const typescriptBin = join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');

function compileResponses(outputDirectory) {
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
                'src/domain/catalogGuards.ts',
                'src/domain/catalogResponses.ts',
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

async function loadParsers() {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'omp-catalog-responses-'));
    await compileResponses(outputDirectory);
    const moduleUrl = `${
        pathToFileURL(join(outputDirectory, 'domain', 'catalogResponses.js')).href
    }?test=${Date.now()}`;
    const parsers = await import(moduleUrl);

    return {
        parsers,
        cleanup: () => rm(outputDirectory, { recursive: true, force: true }),
    };
}

test('catalog response parsers accept typed list and detail envelopes', async () => {
    const { parsers, cleanup } = await loadParsers();
    try {
        assert.deepEqual(parsers.parseCatalogListResponse({ list: [{ id: 1, name: 'Object' }] }), {
            list: [{ id: 1, name: 'Object' }],
        });
        assert.deepEqual(
            parsers.parseCatalogSearchResponse({
                results: [{ id: 400, name: 'Landstalker', model: 'landstal' }],
            }),
            { results: [{ id: 400, name: 'Landstalker', model: 'landstal' }] }
        );
        assert.equal(
            parsers.parseCatalogItemResponse('vehicle', {
                item: {
                    id: 400,
                    name: 'Landstalker',
                    cat: 'Off Road',
                    mods: 'Transfender',
                    model: 'landstal',
                },
            }).item.model,
            'landstal'
        );
    } finally {
        await cleanup();
    }
});

test('catalog response parsers reject malformed and mismatched payloads', async () => {
    const { parsers, cleanup } = await loadParsers();
    try {
        assert.throws(
            () => parsers.parseCatalogListResponse({ list: [{ id: '400', name: 'Invalid' }] }),
            /Invalid catalog response/
        );
        assert.throws(
            () =>
                parsers.parseCatalogItemResponse('vehicle', {
                    item: { id: 1, name: 'Not a vehicle' },
                }),
            /invalid vehicle item/
        );
    } finally {
        await cleanup();
    }
});
