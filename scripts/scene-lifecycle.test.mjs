import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { delimiter, join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import Module from 'node:module';
import test from 'node:test';
import * as THREE from 'three';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const typescriptBin = join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc');

function compileScene(outputDirectory) {
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
                '--esModuleInterop',
                '--resolveJsonModule',
                '--baseUrl',
                '.',
                '--rootDir',
                '.',
                '--outDir',
                outputDirectory,
                'src/rendering/Scene.ts',
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

function createRoot() {
    return {
        offsetWidth: 320,
        offsetHeight: 240,
        children: [],
        appendChild(child) {
            child.parentNode = this;
            this.children.push(child);
        },
        removeChild(child) {
            const index = this.children.indexOf(child);
            if (index >= 0) {
                this.children.splice(index, 1);
            }
            child.parentNode = null;
        },
    };
}

function createLifecycleEnvironment() {
    let nextFrameId = 0;
    const pendingFrames = new Map();
    const cancelledFrames = [];
    const windowListeners = new Map();
    const documentListeners = new Map();
    let rendererDisposed = 0;
    let controlsDisposed = 0;

    const window = {
        addEventListener(type, handler) {
            windowListeners.set(type, handler);
        },
        removeEventListener(type, handler) {
            if (windowListeners.get(type) === handler) {
                windowListeners.delete(type);
            }
        },
    };
    const document = {
        hidden: false,
        addEventListener(type, handler) {
            documentListeners.set(type, handler);
        },
        removeEventListener(type, handler) {
            if (documentListeners.get(type) === handler) {
                documentListeners.delete(type);
            }
        },
    };

    const environment = {
        window,
        document,
        pendingFrames,
        cancelledFrames,
        windowListeners,
        documentListeners,
        get rendererDisposed() {
            return rendererDisposed;
        },
        get controlsDisposed() {
            return controlsDisposed;
        },
        createRenderer() {
            const domElement = { parentNode: null };
            return {
                domElement,
                setSize() {},
                setClearColor() {},
                render() {},
                dispose() {
                    rendererDisposed += 1;
                },
            };
        },
        createTextureLoader() {
            return {
                load() {
                    return {
                        dispose() {},
                    };
                },
            };
        },
        createControls() {
            return {
                enabled: false,
                addEventListener() {},
                dispose() {
                    controlsDisposed += 1;
                },
            };
        },
        install() {
            globalThis.window = window;
            globalThis.document = document;
            globalThis.requestAnimationFrame = (callback) => {
                const frameId = ++nextFrameId;
                pendingFrames.set(frameId, callback);
                return frameId;
            };
            globalThis.cancelAnimationFrame = (frameId) => {
                cancelledFrames.push(frameId);
                pendingFrames.delete(frameId);
            };
        },
    };

    return environment;
}

const identity = [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
];

const model = {
    type: 'object',
    name: 'test-object',
    obj: [
        {
            damaged: false,
            frame: 0,
            geometry: null,
            matrix: identity,
            name: 'root',
            parent: -1,
        },
    ],
    textures: [],
};

const texturedModel = {
    type: 'object',
    name: 'shared-material-object',
    obj: [
        {
            damaged: false,
            frame: 0,
            geometry: {
                facetype: 'Triangles',
                textures: [{ color: [0, 0, 0, 255], indices: [0, 1, 2], name: 'missing' }],
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 1, y: 0, z: 0 },
                    { x: 0, y: 1, z: 0 },
                ],
            },
            matrix: identity,
            name: 'root',
            parent: -1,
        },
        {
            damaged: false,
            frame: 1,
            geometry: {
                facetype: 'Triangles',
                textures: [{ color: [0, 0, 0, 255], indices: [0, 1, 2], name: 'missing' }],
                vertices: [
                    { x: 0, y: 0, z: 0 },
                    { x: 1, y: 0, z: 0 },
                    { x: 0, y: 1, z: 0 },
                ],
            },
            matrix: identity,
            name: 'child',
            parent: 0,
        },
    ],
    textures: [{ name: 'missing', url: 'texture://missing' }],
};

const vehicleWithFailingModification = {
    type: 'vehicle',
    name: 'test-vehicle',
    obj: model.obj,
    textures: [],
    modifications: [1077],
};

const vehicleWithOptionalModification = {
    type: 'vehicle',
    name: 'partial-vehicle',
    obj: [
        {
            damaged: false,
            frame: 0,
            geometry: null,
            matrix: identity,
            name: 'root',
            parent: -1,
        },
        {
            damaged: false,
            frame: 1,
            geometry: null,
            matrix: identity,
            name: 'ug_nitro',
            parent: 0,
        },
    ],
    textures: [],
    modifications: [1077, 1008],
};

const nitroModificationExport = [
    {
        damaged: false,
        frame: 0,
        geometry: {
            facetype: 'Triangles',
            textures: [{ color: [0, 0, 0, 255], indices: [0, 1, 2], name: 'missing' }],
            vertices: [
                { x: 0, y: 0, z: 0 },
                { x: 1, y: 0, z: 0 },
                { x: 0, y: 1, z: 0 },
            ],
        },
        matrix: identity,
        name: 'nitro-part',
        parent: -1,
    },
];

const emptyModel = {
    type: 'object',
    name: 'empty-object',
    obj: [],
    textures: [],
};

test('scene mount, replacement, and disposal release owned resources', async () => {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'omp-scene-lifecycle-'));
    const originalWindow = globalThis.window;
    const originalDocument = globalThis.document;
    const originalRequestAnimationFrame = globalThis.requestAnimationFrame;
    const originalCancelAnimationFrame = globalThis.cancelAnimationFrame;

    try {
        await compileScene(outputDirectory);
        process.env.NODE_PATH = [outputDirectory, join(projectRoot, 'node_modules')].join(
            delimiter
        );
        Module._initPaths();
        const imported = await import(
            `${
                pathToFileURL(join(outputDirectory, 'src', 'rendering', 'Scene.js')).href
            }?test=${Date.now()}`
        );
        const Scene = imported.default.default ?? imported.default;
        const environment = createLifecycleEnvironment();
        environment.install();
        const root = createRoot();
        const scene = new Scene([model], false, async () => model.obj, {
            createRenderer: () => environment.createRenderer(),
            createTextureLoader: () => environment.createTextureLoader(),
            createControls: () => environment.createControls(),
        });

        await scene.mount(root);
        assert.equal(root.children.length, 1);
        assert.equal(environment.windowListeners.size, 1);
        assert.equal(environment.documentListeners.size, 1);
        assert.equal(environment.pendingFrames.size, 1);

        await scene.setModel([model], false);
        assert.equal(root.children.length, 1);
        assert.equal(environment.pendingFrames.size, 1);

        scene.dispose();
        assert.equal(root.children.length, 0);
        assert.equal(environment.rendererDisposed, 1);
        assert.equal(environment.controlsDisposed, 1);
        assert.equal(environment.windowListeners.size, 0);
        assert.equal(environment.documentListeners.size, 0);
        assert.equal(environment.pendingFrames.size, 0);

        scene.dispose();
        assert.equal(environment.rendererDisposed, 1);
        assert.equal(environment.controlsDisposed, 1);

        const materialScene = new Scene([texturedModel], false, async () => texturedModel.obj, {
            createRenderer: () => environment.createRenderer(),
            createTextureLoader: () => environment.createTextureLoader(),
            createControls: () => environment.createControls(),
        });
        await materialScene.mount(root);
        const sceneGraph = materialScene.scene;
        const rootObject = sceneGraph?.getObjectByName('root');
        const childObject = sceneGraph?.getObjectByName('child');
        const rootMesh = rootObject?.children.find((object) => object.type === 'Mesh');
        const childMesh = childObject?.children.find((object) => object.type === 'Mesh');
        assert.ok(rootMesh);
        assert.ok(childMesh);
        const rootMaterial = Array.isArray(rootMesh.material)
            ? rootMesh.material[0]
            : rootMesh.material;
        const childMaterial = Array.isArray(childMesh.material)
            ? childMesh.material[0]
            : childMesh.material;
        assert.strictEqual(rootMaterial, childMaterial);
        assert.equal(rootMaterial.side, THREE.FrontSide);
        assert.equal(materialScene.materialCache.size, 1);
        materialScene.dispose();

        const failingScene = new Scene([model], false, async () => model.obj, {
            createRenderer: () => {
                throw new Error('renderer failed');
            },
        });
        await assert.rejects(failingScene.mount(root), /renderer failed/);
        failingScene.dispose();
        assert.equal(root.children.length, 0);

        const failingAssetScene = new Scene(
            [vehicleWithFailingModification],
            false,
            async () => {
                throw new Error('model export failed');
            },
            {
                createRenderer: () => environment.createRenderer(),
                createTextureLoader: () => environment.createTextureLoader(),
                createControls: () => environment.createControls(),
            }
        );
        await assert.rejects(failingAssetScene.mount(root), /model export failed/);
        failingAssetScene.dispose();
        assert.equal(root.children.length, 0);

        const optionalModificationScene = new Scene(
            [vehicleWithOptionalModification],
            false,
            async (name) => (name === 'nto_b_l' ? nitroModificationExport : []),
            {
                createRenderer: () => environment.createRenderer(),
                createTextureLoader: () => environment.createTextureLoader(),
                createControls: () => environment.createControls(),
            }
        );
        await optionalModificationScene.mount(root);
        const nitroObject = optionalModificationScene.scene?.getObjectByName('ug_nitro');
        assert.ok(nitroObject?.children.some((object) => object.type === 'Mesh'));
        optionalModificationScene.dispose();
        assert.equal(root.children.length, 0);

        const emptyScene = new Scene([emptyModel], false, async () => emptyModel.obj, {
            createRenderer: () => environment.createRenderer(),
            createTextureLoader: () => environment.createTextureLoader(),
            createControls: () => environment.createControls(),
        });
        await assert.rejects(emptyScene.mount(root), /no renderable frames/);
        emptyScene.dispose();
        assert.equal(root.children.length, 0);
    } finally {
        globalThis.window = originalWindow;
        globalThis.document = originalDocument;
        globalThis.requestAnimationFrame = originalRequestAnimationFrame;
        globalThis.cancelAnimationFrame = originalCancelAnimationFrame;
        await rm(outputDirectory, { recursive: true, force: true });
    }
});
