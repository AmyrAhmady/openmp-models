import assert from 'node:assert/strict';

const assetNames = ['landstal', 'truth'];

for (const assetName of assetNames) {
    const assetUrl = `https://assets.open.mp/models/models/${assetName}.dff`;
    const response = await fetch(assetUrl, {
        signal: AbortSignal.timeout(15000),
    });

    assert.equal(response.status, 200, `Model asset request returned ${response.status}`);

    const modelBytes = new Uint8Array(await response.arrayBuffer());
    assert(modelBytes.length > 12, 'Model asset must contain DFF data');
    assert.equal(
        new DataView(modelBytes.buffer).getUint32(0, true),
        0x10,
        'Model asset must start with a RenderWare clump'
    );

    console.log(`Model asset smoke check passed: ${assetUrl}`);
}
