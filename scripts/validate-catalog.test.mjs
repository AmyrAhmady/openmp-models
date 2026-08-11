import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);

test('catalog validation accepts every checked-in catalog', async () => {
    const { stdout } = await execFileAsync(process.execPath, [
        fileURLToPath(new URL('./validate-catalog.mjs', import.meta.url)),
    ]);

    assert.match(stdout, /object: 8626 valid records/);
    assert.match(stdout, /skin: 312 valid records/);
    assert.match(stdout, /vehicle: 212 valid records/);
});
