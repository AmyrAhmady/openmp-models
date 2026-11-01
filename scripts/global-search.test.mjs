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
                'src/domain/globalSearchResponses.ts',
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
    const outputDirectory = await mkdtemp(join(tmpdir(), 'omp-global-search-'));
    await compileResponses(outputDirectory);
    const moduleUrl = `${
        pathToFileURL(join(outputDirectory, 'domain', 'globalSearchResponses.js')).href
    }?test=${Date.now()}`;
    const parsers = await import(moduleUrl);

    return {
        parsers,
        cleanup: () => rm(outputDirectory, { recursive: true, force: true }),
    };
}

test('global search parsers accept grouped results', async () => {
    const { parsers, cleanup } = await loadParsers();
    try {
        const response = {
            vehicle: { results: [{ id: 411, name: 'Infernus', model: 'infernus' }], total: 1 },
            skin: { results: [], total: 0 },
            object: { results: [{ id: 1220, name: 'cardboardbox2' }], total: 3 },
            texture: { results: [{ txd: 'boxes', name: 'crate128' }], total: 1 },
        };

        assert.deepEqual(parsers.parseGlobalSearchResponse(response), response);
    } finally {
        await cleanup();
    }
});

test('global search parsers reject malformed groups', async () => {
    const { parsers, cleanup } = await loadParsers();
    try {
        assert.throws(
            () =>
                parsers.parseGlobalSearchResponse({
                    vehicle: { results: [], total: 0 },
                    skin: { results: [], total: 0 },
                    object: { results: [{ name: 'cardboardbox2' }], total: 1 },
                    texture: { results: [], total: 0 },
                }),
            /Invalid search response/
        );
        assert.throws(
            () => parsers.parseGlobalSearchResponse({ vehicle: { results: [] } }),
            /Invalid search response/
        );
    } finally {
        await cleanup();
    }
});
