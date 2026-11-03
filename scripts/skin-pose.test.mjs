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
const restRotation = new THREE.Matrix4().set(0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1);

function compileSkinPose(outputDirectory) {
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
                '--baseUrl',
                '.',
                '--rootDir',
                '.',
                '--outDir',
                outputDirectory,
                'src/rendering/skinPose.ts',
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

async function loadSkinPose() {
    const outputDirectory = await mkdtemp(join(tmpdir(), 'omp-skin-pose-'));
    await compileSkinPose(outputDirectory);
    process.env.NODE_PATH = [outputDirectory, join(projectRoot, 'node_modules')].join(delimiter);
    Module._initPaths();
    const module = await import(
        `${pathToFileURL(join(outputDirectory, 'src', 'rendering', 'skinPose.js')).href}?test=${Date.now()}`
    );

    return {
        alignSkinRestPose: module.alignSkinRestPose ?? module.default.alignSkinRestPose,
        cleanup: () => rm(outputDirectory, { recursive: true, force: true }),
    };
}

function toRows(matrix) {
    const elements = matrix.elements;
    return [0, 1, 2, 3].map((row) => [
        elements[row],
        elements[4 + row],
        elements[8 + row],
        elements[12 + row],
    ]);
}

function createSkin(pelvisRest) {
    const pelvisBind = new THREE.Matrix4().makeTranslation(0, 0, 1);
    const inverseMatrices = [new THREE.Matrix4(), pelvisBind]
        .map((world) => world.clone().invert().multiply(restRotation))
        .map((matrix) => matrix.toArray());

    return [
        {
            damaged: false,
            frame: 0,
            name: '',
            parent: -1,
            matrix: toRows(new THREE.Matrix4()),
            geometry: {
                facetype: 'Triangles',
                vertices: [],
                textures: [],
                skin: {
                    boneCount: 2,
                    boneFrameIndices: [1, 2],
                    boneIndices: [],
                    inverseMatrices,
                    weights: [],
                },
            },
        },
        {
            damaged: false,
            frame: 1,
            name: 'Root',
            parent: 0,
            matrix: toRows(new THREE.Matrix4()),
            geometry: null,
        },
        {
            damaged: false,
            frame: 2,
            name: 'Pelvis',
            parent: 1,
            matrix: toRows(pelvisRest),
            geometry: null,
        },
    ];
}

test('skins whose rest pose matches their bind pose stay unchanged', async () => {
    const { alignSkinRestPose, cleanup } = await loadSkinPose();
    try {
        const skin = createSkin(new THREE.Matrix4().makeTranslation(0, 0, 1));
        assert.equal(alignSkinRestPose(skin), skin);
    } finally {
        await cleanup();
    }
});

test('skins with a rest pose that ignores their bind pose get the standard rest pose', async () => {
    const { alignSkinRestPose, cleanup } = await loadSkinPose();
    try {
        const standing = createSkin(new THREE.Matrix4().makeTranslation(0, 0, 1));
        const lying = createSkin(
            new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, 0, 1)
        );
        const aligned = alignSkinRestPose(lying);

        assert.notEqual(aligned, lying);
        assert.deepEqual(aligned[0], lying[0]);
        aligned.forEach((frame, index) => {
            frame.matrix.flat().forEach((value, cell) => {
                assert.ok(Math.abs(value - standing[index].matrix.flat()[cell]) < 1e-6);
            });
        });
    } finally {
        await cleanup();
    }
});
