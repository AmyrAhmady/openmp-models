import type { ModelType } from 'src/domain/catalog';
import {
    parseTextureItemResponse,
    parseTextureListResponse,
    parseTextureSearchResponse,
} from 'src/domain/textureResponses';
import type {
    TextureItemResponse,
    TextureListResponse,
    TextureSearchResponse,
} from 'src/domain/textureCatalog';
import { request } from 'src/api/request';

export type TextureSource = {
    txd?: string;
    type?: ModelType;
    id?: number;
};

export type TextureRequest = TextureSource & {
    name: string;
};

export const textureClient = {
    listPage(offset: number, limit: number, signal?: AbortSignal): Promise<TextureListResponse> {
        return request<{ offset: number; limit: number }, TextureListResponse>(
            'GET',
            '/api/textures/list',
            { offset, limit },
            signal
                ? { signal, parse: parseTextureListResponse }
                : { parse: parseTextureListResponse }
        );
    },

    search(query: string, signal?: AbortSignal): Promise<TextureSearchResponse> {
        return request<{ q: string }, TextureSearchResponse>(
            'GET',
            '/api/textures/search',
            { q: query },
            signal
                ? { signal, parse: parseTextureSearchResponse }
                : { parse: parseTextureSearchResponse }
        );
    },

    getItem(
        name: string,
        source: TextureSource,
        signal?: AbortSignal
    ): Promise<TextureItemResponse> {
        return request<TextureRequest, TextureItemResponse>(
            'GET',
            '/api/textures/item',
            { name, ...source },
            signal
                ? { signal, parse: parseTextureItemResponse }
                : { parse: parseTextureItemResponse }
        );
    },
};
