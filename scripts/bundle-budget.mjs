import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const BUILD_MANIFEST = '.next/build-manifest.json';
const ROUTE = '/';
const MAX_RAW_BYTES = 1_200_000;
const MAX_GZIP_BYTES = 350_000;

const manifest = JSON.parse(await readFile(BUILD_MANIFEST, 'utf8'));
const routeFiles = manifest.pages?.[ROUTE];
assert.ok(Array.isArray(routeFiles), `No production bundle entry found for ${ROUTE}`);

const files = [...new Set(routeFiles)].filter((file) => file.endsWith('.js'));
let rawBytes = 0;
let gzipBytes = 0;

for (const file of files) {
    const contents = await readFile(`.next/${file}`);
    rawBytes += contents.length;
    gzipBytes += gzipSync(contents).length;
}

console.log(
    `Bundle budget for ${ROUTE}: ${rawBytes} raw bytes, ${gzipBytes} gzip bytes across ${files.length} JavaScript files`
);
console.log(`Budgets: ${MAX_RAW_BYTES} raw bytes, ${MAX_GZIP_BYTES} gzip bytes`);

assert.ok(rawBytes <= MAX_RAW_BYTES, `Raw bundle exceeds ${MAX_RAW_BYTES} bytes`);
assert.ok(gzipBytes <= MAX_GZIP_BYTES, `Gzip bundle exceeds ${MAX_GZIP_BYTES} bytes`);
