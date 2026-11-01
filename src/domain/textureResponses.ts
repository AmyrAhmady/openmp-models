import type {
    TextureDetails,
    TextureItemResponse,
    TextureListItem,
    TextureListResponse,
    TextureSearchResponse,
    TextureUsage,
} from './textureCatalog';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

export function isTextureListItem(value: unknown): value is TextureListItem {
    return isRecord(value) && isNonEmptyString(value.txd) && isNonEmptyString(value.name);
}

function isTextureUsage(value: unknown): value is TextureUsage {
    return (
        isRecord(value) &&
        (value.type === 'object' || value.type === 'skin' || value.type === 'vehicle') &&
        Number.isInteger(value.id) &&
        typeof value.name === 'string'
    );
}

function isTextureDetails(value: unknown): value is TextureDetails {
    return (
        isTextureListItem(value) &&
        isRecord(value) &&
        Number.isInteger(value.width) &&
        Number.isInteger(value.height) &&
        isNonEmptyString(value.format) &&
        Array.isArray(value.usedBy) &&
        value.usedBy.every(isTextureUsage) &&
        Array.isArray(value.dictionary) &&
        value.dictionary.every(isNonEmptyString)
    );
}

function parseEnvelope(value: unknown, key: 'list' | 'results'): TextureListItem[] {
    if (!isRecord(value) || !Array.isArray(value[key]) || !value[key].every(isTextureListItem)) {
        throw new Error(`Invalid texture response: expected a ${key} array.`);
    }

    return value[key];
}

export function parseTextureListResponse(value: unknown): TextureListResponse {
    return { list: parseEnvelope(value, 'list') };
}

export function parseTextureSearchResponse(value: unknown): TextureSearchResponse {
    return { results: parseEnvelope(value, 'results') };
}

export function parseTextureItemResponse(value: unknown): TextureItemResponse {
    if (!isRecord(value) || !isTextureDetails(value.item)) {
        throw new Error('Invalid texture response: expected a texture item.');
    }

    return { item: value.item };
}
