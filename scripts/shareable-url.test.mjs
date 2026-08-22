import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import test from 'node:test';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const typescriptBin = join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');

async function loadUrlState() {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'omp-shareable-url-'));
    await new Promise((resolve, reject) => {
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
                '--rootDir',
                'src',
                '--outDir',
                outputDirectory,
                'src/domain/shareableUrl.ts',
                'src/domain/modelType.ts',
                'src/domain/vehicleColors.ts',
            ],
            { cwd: projectRoot, stdio: ['ignore', 'pipe', 'pipe'] }
        );
        let output = '';
        compiler.stdout.on('data', (chunk) => (output += chunk.toString()));
        compiler.stderr.on('data', (chunk) => (output += chunk.toString()));
        compiler.on('error', reject);
        compiler.on('close', (code) =>
            code === 0 ? resolve() : reject(new Error(`TypeScript compilation failed:\n${output}`))
        );
    });

    const moduleUrl = `${pathToFileURL(join(outputDirectory, 'domain', 'shareableUrl.js')).href}?test=${Date.now()}`;
    const module = await import(moduleUrl);
    return { module, cleanup: () => rm(outputDirectory, { recursive: true, force: true }) };
}

test('shareable URL state round-trips model features and ignores invalid IDs', async () => {
    const { module, cleanup } = await loadUrlState();
    try {
        const state = module.parseShareableUrl(
            '?cat=skins&model=12&animLib=BAR&anim=Barserve_loop&mods=1000,nope,1000&primaryColor=12&secondaryColor=255&bg=%23dbeafe'
        );

        assert.deepEqual(state, {
            modelType: 'skin',
            modelId: 12,
            animationLibraryId: 'BAR',
            animationName: 'Barserve_loop',
            modificationIds: [1000],
            primaryColorId: 12,
            secondaryColorId: 255,
            backgroundColor: '#dbeafe',
        });
        assert.equal(
            module.serializeShareableUrl(state),
            '?cat=skins&model=12&animLib=BAR&anim=Barserve_loop&mods=1000&primaryColor=12&secondaryColor=255&bg=%23dbeafe'
        );
    } finally {
        await cleanup();
    }
});
