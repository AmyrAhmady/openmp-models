import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawn } from 'node:child_process';
import test from 'node:test';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const typescriptBin = join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');

const validModelExport = [
    {
        damaged: false,
        frame: 0,
        geometry: null,
        matrix: [
            [1, 0, 0, 0],
            [0, 1, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 0, 1],
        ],
        name: 'root',
        parent: -1,
    },
];

function compileDomainModules(outputDirectory) {
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
                '--rootDir',
                'src',
                '--outDir',
                outputDirectory,
                'src/domain/modelAssets.ts',
                'src/domain/modelAssetClient.ts',
                'src/domain/modelPreview.ts',
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

async function loadPreview() {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'omp-model-preview-'));
    await compileDomainModules(outputDirectory);

    const moduleUrl = `${pathToFileURL(join(outputDirectory, 'domain', 'modelPreview.js')).href}?test=${Date.now()}`;
    const preview = await import(moduleUrl);

    return {
        preview,
        cleanup: () => rm(outputDirectory, { recursive: true, force: true }),
    };
}

async function loadClient() {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'omp-model-client-'));
    await compileDomainModules(outputDirectory);

    const moduleUrl = `${pathToFileURL(join(outputDirectory, 'domain', 'modelAssetClient.js')).href}?test=${Date.now()}`;
    const client = await import(moduleUrl);

    return {
        client,
        cleanup: () => rm(outputDirectory, { recursive: true, force: true }),
    };
}

test('model asset client caches normalized requests and returns parsed exports', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = async (input) => {
        fetchCount += 1;
        assert.equal(input, 'https://assets.open.mp/models/exports/landstal.json');
        return {
            ok: true,
            status: 200,
            json: async () => validModelExport,
        };
    };

    const { client, cleanup } = await loadClient();
    try {
        const first = client.getModelExport(' LANDSTAL ');
        const second = client.getModelExport('landstal');

        assert.strictEqual(first, second);
        assert.deepEqual(await first, validModelExport);
        assert.equal(fetchCount, 1);
    } finally {
        globalThis.fetch = originalFetch;
        await cleanup();
    }
});

test('model asset client aborts an individual consumer without poisoning the shared cache', async () => {
    const originalFetch = globalThis.fetch;
    let resolveFetch;
    globalThis.fetch = () =>
        new Promise((resolve) => {
            resolveFetch = resolve;
        });

    const { client, cleanup } = await loadClient();
    try {
        const controller = new AbortController();
        const abortedRequest = client.getModelExport('slow', { signal: controller.signal });
        controller.abort();

        await assert.rejects(abortedRequest, /aborted/);

        resolveFetch({
            ok: true,
            status: 200,
            json: async () => validModelExport,
        });
        assert.deepEqual(await client.getModelExport('slow'), validModelExport);
    } finally {
        globalThis.fetch = originalFetch;
        await cleanup();
    }
});

test('model asset cache evicts the oldest resolved exports at its memory bound', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = async () => {
        fetchCount += 1;
        return {
            ok: true,
            status: 200,
            json: async () => validModelExport,
        };
    };

    const { client, cleanup } = await loadClient();
    try {
        await Promise.all(
            Array.from({ length: 32 }, (_, index) => client.getModelExport(`model-${index}`))
        );
        await client.getModelExport('model-32');
        await client.getModelExport('model-0');

        assert.equal(fetchCount, 34);
    } finally {
        globalThis.fetch = originalFetch;
        await cleanup();
    }
});

test('model asset client rejects invalid payloads and allows a retry', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = async () => {
        fetchCount += 1;
        return {
            ok: true,
            status: 200,
            json: async () =>
                fetchCount === 1
                    ? [
                          {
                              ...validModelExport[0],
                              geometry: {
                                  facetype: 'Triangles',
                                  textures: [],
                                  vertices: [{ x: 'invalid', y: 0, z: 0 }],
                              },
                          },
                      ]
                    : validModelExport,
        };
    };

    const { client, cleanup } = await loadClient();
    try {
        await assert.rejects(
            client.getModelExport('broken'),
            /Model "broken": Invalid model export payload at frames\[0\]\.geometry\.vertices\[0\]\.x/
        );
        assert.deepEqual(await client.getModelExport('broken'), validModelExport);
        assert.equal(fetchCount, 2);
    } finally {
        globalThis.fetch = originalFetch;
        await cleanup();
    }
});

test('model asset client preserves HTTP status for unavailable assets', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: false, status: 404 });

    const { client, cleanup } = await loadClient();
    try {
        await assert.rejects(
            client.getModelExport('cj'),
            (error) =>
                error instanceof Error && error.name === 'ModelAssetError' && error.status === 404
        );
    } finally {
        globalThis.fetch = originalFetch;
        await cleanup();
    }
});

test('model preview data normalizes names, deduplicates textures, and preserves typed defaults', async () => {
    const { preview, cleanup } = await loadPreview();
    try {
        const modelExport = [
            {
                ...validModelExport[0],
                geometry: {
                    facetype: 'Triangles',
                    textures: [
                        { color: [1, 1, 1, 1], indices: [0], name: 'Body' },
                        { color: [1, 1, 1, 1], indices: [0], name: 'body' },
                        { color: [1, 1, 1, 1], indices: [0], name: 'Glass' },
                    ],
                    vertices: [{ x: 0, y: 0, z: 0 }],
                },
            },
        ];
        const model = preview.createModelPreviewData(
            ' LANDSTAL ',
            'vehicle',
            modelExport,
            () => 0.5
        );

        assert.equal(model.name, 'landstal');
        assert.deepEqual(model.textures, [
            {
                name: 'Body',
                url: 'https://assets.open.mp/models/exports/body.png',
            },
            {
                name: 'Glass',
                url: 'https://assets.open.mp/models/exports/glass.png',
            },
        ]);
        assert.deepEqual(model.color, { primary: 127, secondary: 127 });
        assert.deepEqual(model.modifications, [1077, 1008]);

        const skin = preview.createModelPreviewData('CJ', 'skin', modelExport, () => 0.5);
        const object = preview.createModelPreviewData('crate', 'object', modelExport, () => 0.5);
        assert.equal(skin.modifications, undefined);
        assert.equal(object.modifications, undefined);
    } finally {
        await cleanup();
    }
});

test('model asset client rejects HTTP failures and does not cache them', async () => {
    const originalFetch = globalThis.fetch;
    let fetchCount = 0;
    globalThis.fetch = async () => {
        fetchCount += 1;
        return { ok: false, status: 404, json: async () => ({}) };
    };

    const { client, cleanup } = await loadClient();
    try {
        await assert.rejects(client.getModelExport('missing'), /status 404/);
        await assert.rejects(client.getModelExport('missing'), /status 404/);
        assert.equal(fetchCount, 2);
    } finally {
        globalThis.fetch = originalFetch;
        await cleanup();
    }
});
