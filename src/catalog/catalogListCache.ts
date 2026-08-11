import type { CatalogListItem, ModelType } from 'src/domain/catalog';

const catalogListCache = new Map<ModelType, CatalogListItem[]>();
const catalogListRequests = new Map<ModelType, Promise<CatalogListItem[]>>();
let catalogListCacheGeneration = 0;

function createAbortError(): Error {
    const error = new Error('Catalog list request was cancelled');
    error.name = 'AbortError';
    return error;
}

function withAbort<T>(request: Promise<T>, signal: AbortSignal): Promise<T> {
    if (signal.aborted) {
        return Promise.reject(createAbortError());
    }

    return new Promise<T>((resolve, reject) => {
        const cleanup = () => signal.removeEventListener('abort', onAbort);
        const onAbort = () => {
            cleanup();
            reject(createAbortError());
        };

        signal.addEventListener('abort', onAbort, { once: true });
        request.then(
            (value) => {
                cleanup();
                resolve(value);
            },
            (error: unknown) => {
                cleanup();
                reject(error);
            }
        );
    });
}

export function getCachedCatalogList(type: ModelType): CatalogListItem[] | undefined {
    return catalogListCache.get(type);
}

export function cacheCatalogList(type: ModelType, list: CatalogListItem[]): void {
    catalogListCache.set(type, list);
}

export function getOrLoadCatalogList(
    type: ModelType,
    load: (type: ModelType) => Promise<CatalogListItem[]>,
    signal?: AbortSignal
): Promise<CatalogListItem[]> {
    const cachedList = getCachedCatalogList(type);
    if (cachedList) {
        const resolved = Promise.resolve(cachedList);
        return signal ? withAbort(resolved, signal) : resolved;
    }

    let request = catalogListRequests.get(type);
    if (!request) {
        const generation = catalogListCacheGeneration;
        request = load(type).then((list) => {
            if (generation === catalogListCacheGeneration) {
                cacheCatalogList(type, list);
            }
            return list;
        });
        catalogListRequests.set(type, request);
        request.catch(() => {
            if (catalogListRequests.get(type) === request) {
                catalogListRequests.delete(type);
            }
        });
    }

    return signal ? withAbort(request, signal) : request;
}

export function clearCatalogListCache(): void {
    catalogListCacheGeneration += 1;
    catalogListCache.clear();
    catalogListRequests.clear();
}
