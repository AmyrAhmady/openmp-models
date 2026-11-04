import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const typescriptBin = join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');

const domainSource = await readFile(
    new URL('../src/domain/catalogInfo.ts', import.meta.url),
    'utf8'
);
const pageSource = await readFile(new URL('../src/pages/index.tsx', import.meta.url), 'utf8');

test('catalog info labels and row mapping stay in the domain boundary', () => {
    assert.match(domainSource, /export function getCatalogInfoRows\(item: CatalogItem\)/);
    assert.match(domainSource, /infoLabels\[key\] \?\? 'Unknown info'/);
    assert.match(domainSource, /export function getTextureInfoRows\(texture: TextureDetails\)/);
    assert.match(
        pageSource,
        /import \{ getCatalogInfoRows, getTextureInfoRows \} from 'src\/domain\/catalogInfo';/
    );
    assert.doesNotMatch(pageSource, /realNames|getInfoRows/);
});

function compileCatalogInfo(outputDirectory) {
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
                '--baseUrl',
                '.',
                '--rootDir',
                'src',
                '--outDir',
                outputDirectory,
                'src/domain/catalogInfo.ts',
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

test('catalog info shows the model size in metres', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'omp-catalog-info-'));
    try {
        await compileCatalogInfo(outputDirectory);
        const { getCatalogInfoRows } = await import(
            pathToFileURL(join(outputDirectory, 'domain', 'catalogInfo.js')).href
        );
        const rows = getCatalogInfoRows({
            id: 411,
            name: 'Infernus',
            txd: 'infernus.txd',
            size: [2.462, 5.458, 1.382],
        });

        assert.deepEqual(rows, [
            { label: 'Model ID', value: '411' },
            { label: 'Name', value: 'Infernus' },
            { label: 'Texture File', value: 'infernus.txd' },
            { label: 'Width', value: '2.46 m' },
            { label: 'Depth', value: '5.46 m' },
            { label: 'Height', value: '1.38 m' },
        ]);
    } finally {
        await rm(outputDirectory, { recursive: true, force: true });
    }
});
