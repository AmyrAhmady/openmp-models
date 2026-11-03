import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { promisify } from 'node:util';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

test('catalog validation accepts every checked-in catalog', async () => {
    const { stdout } = await execFileAsync(process.execPath, [
        fileURLToPath(new URL('./validate-catalog.mjs', import.meta.url)),
    ]);

    assert.match(stdout, /object: 11336 valid records/);
    assert.match(stdout, /skin: 312 valid records/);
    assert.match(stdout, /vehicle: 212 valid records/);
    assert.match(stdout, /texture: 32216 valid records/);
    assert.match(stdout, /placement: 8518 valid records/);
});

test('vehicle catalog models match the viewer model names', async () => {
    const [catalogSource, serviceSource] = await Promise.all([
        readFile(new URL('../data/source/catalogs/vehicles.json', import.meta.url), 'utf8'),
        readFile(new URL('../src/rendering/Service.ts', import.meta.url), 'utf8'),
    ]);
    const table = serviceSource.slice(serviceSource.indexOf('vehicleModelNames = {'));
    const modelNames = new Map(
        [...table.slice(0, table.indexOf('};')).matchAll(/'(\d+)': '([^']+)'/g)].map(
            ([, id, name]) => [Number(id), name]
        )
    );

    for (const vehicle of JSON.parse(catalogSource)) {
        assert.equal(vehicle.model, modelNames.get(vehicle.id), `vehicle ${vehicle.id}`);
    }
});

test('skin sizes stand upright', async () => {
    const skins = JSON.parse(
        await readFile(new URL('../data/source/catalogs/skins.json', import.meta.url), 'utf8')
    );

    for (const skin of skins.filter((item) => item.size)) {
        const [width, depth, height] = skin.size;
        assert.ok(height > width && height > depth, `skin ${skin.id}`);
    }
});
