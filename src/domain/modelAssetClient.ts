import { parseDff } from './dffParser';
import type { ModelExport } from './modelAssets';

const MODEL_BASE_URL = 'https://assets.open.mp/models/models/';
const MODEL_EXPORT_CACHE_LIMIT = 32;

interface ModelExportCacheEntry {
    request: Promise<ModelExport>;
    resolved: boolean;
    controller: AbortController;
    activeConsumers: number;
    hasUntrackedConsumer: boolean;
    abortTimer: ReturnType<typeof setTimeout> | undefined;
}

const modelExportCache = new Map<string, ModelExportCacheEntry>();

export interface ModelAssetRequestOptions {
    signal?: AbortSignal;
}

export class ModelAssetError extends Error {
    readonly status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = 'ModelAssetError';
        this.status = status;
    }
}

export type ModelAssetLoader = (
    name: string,
    options?: ModelAssetRequestOptions
) => Promise<ModelExport>;

function normalizeModelName(name: string): string {
    return name.trim().toLowerCase();
}

function createAbortError(): Error {
    const error = new Error('Model request aborted');
    error.name = 'AbortError';
    return error;
}

export function isModelAssetAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
}

function clearAbortTimer(entry: ModelExportCacheEntry): void {
    if (entry.abortTimer === undefined) {
        return;
    }

    clearTimeout(entry.abortTimer);
    entry.abortTimer = undefined;
}

function releaseConsumer(name: string, entry: ModelExportCacheEntry): void {
    entry.activeConsumers = Math.max(0, entry.activeConsumers - 1);
    if (
        entry.activeConsumers > 0 ||
        entry.resolved ||
        entry.hasUntrackedConsumer ||
        entry.abortTimer !== undefined
    ) {
        return;
    }

    entry.abortTimer = setTimeout(() => {
        entry.abortTimer = undefined;
        if (
            entry.activeConsumers === 0 &&
            !entry.resolved &&
            !entry.hasUntrackedConsumer &&
            modelExportCache.get(name) === entry
        ) {
            modelExportCache.delete(name);
            entry.controller.abort();
        }
    }, 0);
}

function retainConsumer(entry: ModelExportCacheEntry): void {
    clearAbortTimer(entry);
    entry.activeConsumers += 1;
}

function withAbort(
    name: string,
    entry: ModelExportCacheEntry,
    signal: AbortSignal
): Promise<ModelExport> {
    if (signal.aborted) {
        return Promise.reject(createAbortError());
    }

    retainConsumer(entry);

    return new Promise<ModelExport>((resolve, reject) => {
        let released = false;
        const release = () => {
            if (released) {
                return;
            }

            released = true;
            releaseConsumer(name, entry);
        };
        const cleanup = () => signal.removeEventListener('abort', onAbort);
        const onAbort = () => {
            cleanup();
            release();
            reject(createAbortError());
        };

        signal.addEventListener('abort', onAbort, { once: true });
        if (signal.aborted) {
            onAbort();
            return;
        }

        entry.request.then(
            (value) => {
                cleanup();
                release();
                resolve(value);
            },
            (error: unknown) => {
                cleanup();
                release();
                reject(error);
            }
        );
    });
}

function touchCacheEntry(name: string, entry: ModelExportCacheEntry): void {
    modelExportCache.delete(name);
    modelExportCache.set(name, entry);
}

function evictResolvedEntries(): void {
    while (modelExportCache.size > MODEL_EXPORT_CACHE_LIMIT) {
        const oldestResolvedEntry = Array.from(modelExportCache.entries()).find(
            ([, entry]) => entry.resolved
        );

        if (!oldestResolvedEntry) {
            return;
        }

        modelExportCache.delete(oldestResolvedEntry[0]);
    }
}

export function getModelExport(
    name: string,
    options?: ModelAssetRequestOptions
): Promise<ModelExport> {
    const normalizedName = normalizeModelName(name);
    const cached = modelExportCache.get(normalizedName);
    if (cached) {
        touchCacheEntry(normalizedName, cached);
        if (options?.signal) {
            return withAbort(normalizedName, cached, options.signal);
        }

        clearAbortTimer(cached);
        cached.hasUntrackedConsumer = true;
        return cached.request;
    }

    const controller = new AbortController();
    const requestInit: RequestInit = {};
    requestInit.signal = controller.signal;

    const request = fetch(
        `${MODEL_BASE_URL}${encodeURIComponent(normalizedName)}.dff`,
        requestInit
    ).then(async (response) => {
        if (!response.ok) {
            throw new ModelAssetError(
                `Model request failed with status ${response.status}`,
                response.status
            );
        }

        try {
            return parseDff(await response.arrayBuffer());
        } catch (error) {
            throw new Error(
                `Model "${normalizedName}" could not be parsed as a RenderWare DFF: ${
                    error instanceof Error ? error.message : 'unknown parser error'
                }`
            );
        }
    });

    const cacheEntry: ModelExportCacheEntry = {
        request,
        resolved: false,
        controller,
        activeConsumers: 0,
        hasUntrackedConsumer: false,
        abortTimer: undefined,
    };
    modelExportCache.set(normalizedName, cacheEntry);
    void request.then(
        () => {
            if (modelExportCache.get(normalizedName) === cacheEntry) {
                clearAbortTimer(cacheEntry);
                cacheEntry.resolved = true;
                touchCacheEntry(normalizedName, cacheEntry);
                evictResolvedEntries();
            }
        },
        () => {
            clearAbortTimer(cacheEntry);
            if (modelExportCache.get(normalizedName) === cacheEntry) {
                modelExportCache.delete(normalizedName);
            }
        }
    );
    evictResolvedEntries();

    if (options?.signal) {
        return withAbort(normalizedName, cacheEntry, options.signal);
    }

    cacheEntry.hasUntrackedConsumer = true;
    return request;
}

export function clearModelExportCache(): void {
    for (const entry of Array.from(modelExportCache.values())) {
        clearAbortTimer(entry);
        if (!entry.resolved) {
            entry.controller.abort();
        }
    }
    modelExportCache.clear();
}
