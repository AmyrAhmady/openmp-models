import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const nextBin = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
const port = 3107;
const baseUrl = `http://127.0.0.1:${port}`;

function wait(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitForServer(server) {
    let lastError;
    for (let attempt = 0; attempt < 30; attempt += 1) {
        try {
            const response = await fetch(`${baseUrl}/`);
            if (response.ok) {
                return;
            }
            lastError = new Error(`Server returned ${response.status}`);
        } catch (error) {
            lastError = error;
        }
        await wait(250);
    }

    server.kill();
    throw new Error(
        `Production server did not become ready: ${lastError?.message || 'unknown error'}`
    );
}

async function getJson(path, options) {
    const response = await fetch(`${baseUrl}${path}`, options);
    return { response, body: await response.json() };
}

const server = spawn(process.execPath, [nextBin, 'start', '-p', String(port)], {
    cwd: projectRoot,
    stdio: ['ignore', 'pipe', 'pipe'],
});

let serverOutput = '';
server.stdout.on('data', (chunk) => {
    serverOutput += chunk.toString();
});
server.stderr.on('data', (chunk) => {
    serverOutput += chunk.toString();
});

try {
    await waitForServer(server);

    const list = await getJson('/api/list?type=vehicle');
    assert.equal(list.response.status, 200);
    assert.equal(list.body.list.length, 212);
    assert.equal(list.body.list[0].name, 'Landstalker');
    assert.deepEqual(Object.keys(list.body.list[0]).sort(), ['id', 'model', 'name']);

    const objectList = await getJson('/api/list?type=object&offset=0&limit=500');
    assert.equal(objectList.response.status, 200);
    assert.equal(objectList.body.list.length, 500);
    assert.deepEqual(Object.keys(objectList.body.list[0]).sort(), ['id', 'name']);

    const objectListTail = await getJson('/api/list?type=object&offset=10000&limit=500');
    assert.equal(objectListTail.response.status, 200);
    assert.equal(objectListTail.body.list.length, 71);

    const search = await getJson('/api/search?type=vehicle&q=400');
    assert.equal(search.response.status, 200);
    assert.deepEqual(
        search.body.results.map((item) => item.name),
        ['AT400', 'BF-400', 'Landstalker']
    );
    assert.deepEqual(Object.keys(search.body.results[0]).sort(), ['id', 'model', 'name']);

    const item = await getJson('/api/item?type=vehicle&id=400');
    assert.equal(item.response.status, 200);
    assert.equal(item.body.item.name, 'Landstalker');
    assert.equal(item.body.item.cat, 'Off Road');

    const missingItem = await getJson('/api/item?type=vehicle&id=9999');
    assert.equal(missingItem.response.status, 404);
    assert.equal(missingItem.body.error.code, 'MODEL_NOT_FOUND');

    const invalid = await getJson('/api/list');
    assert.equal(invalid.response.status, 400);
    assert.equal(invalid.body.error.code, 'INVALID_MODEL_TYPE');

    const textureList = await getJson('/api/textures/list?offset=0&limit=500');
    assert.equal(textureList.response.status, 200);
    assert.equal(textureList.body.list.length, 500);
    assert.deepEqual(Object.keys(textureList.body.list[0]).sort(), ['name', 'txd']);

    const textureSearch = await getJson('/api/textures/search?q=cardboxes');
    assert.equal(textureSearch.response.status, 200);
    assert.ok(
        textureSearch.body.results.some(
            (texture) => texture.txd === 'boxes' && texture.name === 'cardboxes_128'
        )
    );

    const texture = await getJson('/api/textures/item?txd=boxes&name=cardboxes_128');
    assert.equal(texture.response.status, 200);
    assert.equal(texture.body.item.width, 128);
    assert.deepEqual(texture.body.item.dictionary, ['crate128', 'cardboxes_128']);
    assert.ok(
        texture.body.item.usedBy.some((usage) => usage.type === 'object' && usage.id === 1220)
    );

    const vehicleTexture = await getJson('/api/textures/item?txd=infernus&name=infernus92wheel32');
    assert.deepEqual(vehicleTexture.body.item.usedBy, [
        { type: 'vehicle', id: 411, name: 'Infernus', model: 'infernus' },
    ]);

    const modelTexture = await getJson('/api/textures/item?name=cardboxes_128&type=object&id=1220');
    assert.equal(modelTexture.response.status, 200);
    assert.equal(modelTexture.body.item.txd, 'boxes');

    const missingTexture = await getJson('/api/textures/item?txd=boxes&name=missing');
    assert.equal(missingTexture.response.status, 404);
    assert.equal(missingTexture.body.error.code, 'TEXTURE_NOT_FOUND');

    const invalidTexture = await getJson('/api/textures/item?name=cardboxes_128');
    assert.equal(invalidTexture.response.status, 400);
    assert.equal(invalidTexture.body.error.code, 'INVALID_TEXTURE_SOURCE');

    const searchAll = await getJson('/api/search/all?q=infernus');
    assert.equal(searchAll.response.status, 200);
    assert.equal(searchAll.body.vehicle.results[0].name, 'Infernus');
    assert.equal(searchAll.body.vehicle.total, 1);
    assert.ok(searchAll.body.texture.results.every((texture) => texture.txd === 'infernus'));

    const emptySearchAll = await getJson('/api/search/all?q=');
    assert.equal(emptySearchAll.response.status, 200);
    assert.equal(emptySearchAll.body.object.total, 0);

    const method = await getJson('/api/list?type=vehicle', { method: 'POST' });
    assert.equal(method.response.status, 405);
    assert.equal(method.response.headers.get('allow'), 'GET');

    console.log('API smoke checks passed');
} catch (error) {
    console.error(serverOutput);
    throw error;
} finally {
    server.kill();
}
