import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const clientModules = [
    '../src/catalog/catalogClient.ts',
    '../src/hooks/useCatalogQuery.ts',
    '../src/pages/index.tsx',
    '../src/components/Menu/Desktop.tsx',
    '../src/components/Header/index.tsx',
    '../src/components/Menu/Mobile/index.tsx',
    '../src/components/Menu/Mobile/ModelInfoMobile.tsx',
    '../src/components/Menu/Mobile/ModelList.tsx',
    '../src/components/ModelInfo/index.tsx',
    '../src/catalog/textureClient.ts',
    '../src/hooks/useTextureQuery.ts',
    '../src/hooks/useTextureSelection.ts',
    '../src/components/Menu/TextureDesktop.tsx',
    '../src/components/TextureStage/index.tsx',
    '../src/components/TextureGrid/index.tsx',
    '../src/components/TextureUsageList/index.tsx',
    '../src/components/Menu/Mobile/TextureMenuMobile.tsx',
    '../src/components/Menu/Mobile/ModelTexturesMobile.tsx',
    '../src/components/GlobalSearch/index.tsx',
    '../src/hooks/useGlobalSearch.ts',
    '../src/catalog/placementClient.ts',
    '../src/hooks/usePlacements.ts',
    '../src/components/RadarMap/index.tsx',
    '../src/components/ModelMap/index.tsx',
    '../src/components/Menu/Mobile/ModelMapMobile.tsx',
];
const catalogClientSource = await readFile(
    new URL('../src/catalog/catalogClient.ts', import.meta.url),
    'utf8'
);
const catalogSearchSource = await readFile(
    new URL('../src/catalog/catalogSearch.ts', import.meta.url),
    'utf8'
);

test('client-facing modules import catalog contracts as types only', async () => {
    const sources = await Promise.all(
        clientModules.map((modulePath) =>
            readFile(new URL(modulePath, import.meta.url), 'utf8').then((source) => ({
                modulePath,
                source,
            }))
        )
    );

    for (const { modulePath, source } of sources) {
        assert.doesNotMatch(
            source,
            /import\s+(?!type\b)\{[^}]*\}\s+from\s+['"]src\/domain\/catalog['"]/,
            `${modulePath} must not create a runtime catalog import`
        );
        assert.doesNotMatch(
            source,
            /src\/catalog\/textureRegistry/,
            `${modulePath} must not import the server texture registry`
        );
        assert.doesNotMatch(
            source,
            /src\/catalog\/placementRegistry/,
            `${modulePath} must not import the server placement registry`
        );
    }
    assert.match(catalogClientSource, /from 'src\/api\/request'/);
    assert.doesNotMatch(catalogClientSource, /src\/utils\/api/);
});

test('catalog search defers sorting until after filtering', () => {
    const indexCreation = catalogSearchSource.slice(
        catalogSearchSource.indexOf('function createSearchIndex'),
        catalogSearchSource.indexOf('const searchIndex')
    );
    const queryExecution = catalogSearchSource.slice(
        catalogSearchSource.indexOf('export function searchCatalog')
    );

    assert.doesNotMatch(indexCreation, /\.sort\(/);
    assert.match(queryExecution, /\.filter\([\s\S]*\.sort\(/);
});
