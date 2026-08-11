# open.mp model library

The open.mp model library is a Next.js application for browsing vehicle, skin, and object catalogues and previewing their 3D assets.

## Development

### Requirements

* Node.js 20 or newer
* Yarn 1.x

Install dependencies and start the development server:

```bash
yarn install
yarn dev
```

Then open http://localhost:3000.

## Project structure

```text
src/
  api/                      Typed API request boundary
  catalog/                  Catalog client, cache, search, and query controller
  components/               React Native Web UI and Three.js viewer
  domain/                   Typed catalog and model-asset contracts/parsers
  hooks/                    Feature hooks, including catalog and modal behavior
  pages/                    Next pages, app shell, document, and API routes
  rendering/                Three.js scene, model, and renderer infrastructure
  theme/                    Theme tokens, context, storage, and shared palettes
data/source/catalogs/       Checked-in JSON catalogue snapshots
scripts/                    Validation, smoke checks, and tests
docs/                       Project documentation and development notes
```

Catalogue lists are served through the catalog APIs, while full catalogue records remain on the server. Model exports and textures are loaded from the open.mp asset host when a model is selected for preview.

The 3D viewer is loaded client-side and uses Three.js for rendering. Model and catalogue requests are validated at runtime, support cancellation, and avoid applying stale responses.

## Verification

The following commands can be used to verify changes locally:

```bash
yarn typecheck
yarn lint
yarn format:check
yarn test
yarn validate:catalog
yarn build
yarn check:bundle
yarn test:api
yarn test:asset
```

The test suite covers catalogue validation, API response parsing, search and query cancellation, model-asset caching, geometry conversion, render scheduling, scene lifecycle and disposal, and theme behaviour.

The API and asset smoke tests start a production server when required or request the public model asset endpoint.

CI runs type checking, tests, linting, formatting checks, catalogue validation, production builds, and bundle-size checks.

The current `/` route bundle budget is:

* 1.2 MB raw
* 350 KB gzip

## Data and assets

Catalogue snapshots are stored in [`data/source/catalogs`](data/source/catalogs).

They can be validated with:

```bash
yarn validate:catalog
```

Model preview data is fetched from:

```text
https://assets.open.mp/models/exports/
```

Model exports are validated before being passed to the renderer, and successfully loaded assets are cached for reuse.
