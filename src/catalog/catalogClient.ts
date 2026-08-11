import type {
    CatalogItemResponse,
    CatalogListResponse,
    CatalogSearchResponse,
    ModelType,
} from 'src/domain/catalog';
import {
    parseCatalogItemResponse,
    parseCatalogListResponse,
    parseCatalogSearchResponse,
} from 'src/domain/catalogResponses';
import { getOrLoadCatalogList } from 'src/catalog/catalogListCache';
import { request } from 'src/api/request';

export const catalogClient = {
    list(type: ModelType, signal?: AbortSignal): Promise<CatalogListResponse> {
        return getOrLoadCatalogList(
            type,
            (modelType) =>
                request<{ type: ModelType }, CatalogListResponse>(
                    'GET',
                    '/api/list',
                    {
                        type: modelType,
                    },
                    { parse: parseCatalogListResponse }
                ).then((response) => response.list),
            signal
        ).then((list) => ({ list }));
    },

    listPage(
        type: ModelType,
        offset: number,
        limit: number,
        signal?: AbortSignal
    ): Promise<CatalogListResponse> {
        return request<{ type: ModelType; offset: number; limit: number }, CatalogListResponse>(
            'GET',
            '/api/list',
            { type, offset, limit },
            signal
                ? { signal, parse: parseCatalogListResponse }
                : { parse: parseCatalogListResponse }
        );
    },

    search(type: ModelType, query: string, signal?: AbortSignal): Promise<CatalogSearchResponse> {
        return request<{ type: ModelType; q: string }, CatalogSearchResponse>(
            'GET',
            '/api/search',
            { type, q: query },
            signal
                ? { signal, parse: parseCatalogSearchResponse }
                : { parse: parseCatalogSearchResponse }
        );
    },

    getItem(type: ModelType, id: number, signal?: AbortSignal): Promise<CatalogItemResponse> {
        return request<{ type: ModelType; id: number }, CatalogItemResponse>(
            'GET',
            '/api/item',
            { type, id },
            signal
                ? { signal, parse: (value) => parseCatalogItemResponse(type, value) }
                : { parse: (value) => parseCatalogItemResponse(type, value) }
        );
    },
};
