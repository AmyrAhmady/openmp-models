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
                'src/domain/textureCatalog.ts',
                'src/domain/textureResponses.ts',
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
    const outputDirectory = await mkdtemp(join(tmpdir(), 'omp-texture-responses-'));
    await compileResponses(outputDirectory);
    const moduleUrl = `${
        pathToFileURL(join(outputDirectory, 'domain', 'textureResponses.js')).href
    }?test=${Date.now()}`;
    const parsers = await import(moduleUrl);

    return {
        parsers,
        cleanup: () => rm(outputDirectory, { recursive: true, force: true }),
    };
}

test('texture response parsers accept typed list and detail envelopes', async () => {
    const { parsers, cleanup } = await loadParsers();
    try {
        const item = {
            txd: 'boxes',
            name: 'cardboxes_128',
            width: 128,
            height: 128,
            format: 'DXT1',
            usedBy: [{ type: 'object', id: 1220, name: 'cardboardbox2' }],
            dictionary: ['crate128', 'cardboxes_128'],
        };

        assert.deepEqual(
            parsers.parseTextureListResponse({ list: [{ txd: 'boxes', name: 'crate128' }] }),
            { list: [{ txd: 'boxes', name: 'crate128' }] }
        );
        assert.deepEqual(
            parsers.parseTextureSearchResponse({
                results: [{ txd: 'boxes', name: 'cardboxes_128' }],
            }),
            { results: [{ txd: 'boxes', name: 'cardboxes_128' }] }
        );
        assert.deepEqual(parsers.parseTextureItemResponse({ item }), { item });
    } finally {
        await cleanup();
    }
});

test('texture response parsers reject malformed payloads', async () => {
    const { parsers, cleanup } = await loadParsers();
    try {
        assert.throws(() => parsers.parseTextureListResponse({ list: [{ txd: 'boxes' }] }));
        assert.throws(() => parsers.parseTextureSearchResponse({ list: [] }));
        assert.throws(() =>
            parsers.parseTextureItemResponse({
                item: {
                    txd: 'boxes',
                    name: 'crate128',
                    width: 128,
                    height: 128,
                    format: 'DXT1',
                    usedBy: [{ type: 'texture', id: 1, name: 'crate' }],
                    dictionary: [],
                },
            })
        );
    } finally {
        await cleanup();
    }
});
