import assert from 'node:assert/strict';

const assetNames = ['landstal', 'truth'];

for (const assetName of assetNames) {
    const assetUrl = `https://assets.open.mp/models/exports/${assetName}.json`;
    const response = await fetch(assetUrl, {
        signal: AbortSignal.timeout(15000),
    });

    assert.equal(response.status, 200, `Model asset request returned ${response.status}`);

    const modelExport = await response.json();
    assert(Array.isArray(modelExport), 'Model asset must be an array of frames');
    assert(modelExport.length > 0, 'Model asset must contain at least one frame');
    assert(
        modelExport.some(
            (frame) => frame && frame.geometry && Array.isArray(frame.geometry.textures)
        ),
        'Model asset must contain at least one textured geometry frame'
    );

    console.log(`Model asset smoke check passed: ${assetUrl}`);
}
