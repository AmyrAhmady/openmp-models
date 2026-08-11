import type {
    CatalogItemResponse,
    CatalogListItem,
    CatalogListResponse,
    CatalogSearchResponse,
    ModelType,
} from './catalog';
import { isObjectInfo, isSkinInfo, isVehicleInfo } from './catalogGuards';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isListItem(value: unknown): value is CatalogListItem {
    if (!isRecord(value) || !Number.isInteger(value.id) || typeof value.name !== 'string') {
        return false;
    }

    return value.model === undefined || (typeof value.model === 'string' && value.model.length > 0);
}

function parseEnvelope<T>(
    value: unknown,
    key: 'list' | 'results',
    isItem: (item: unknown) => item is T
): T[] {
    if (!isRecord(value) || !Array.isArray(value[key]) || !value[key].every(isItem)) {
        throw new Error(`Invalid catalog response: expected a ${key} array.`);
    }

    return value[key];
}

export function parseCatalogListResponse(value: unknown): CatalogListResponse {
    return { list: parseEnvelope(value, 'list', isListItem) };
}

export function parseCatalogSearchResponse(value: unknown): CatalogSearchResponse {
    return { results: parseEnvelope(value, 'results', isListItem) };
}

export function parseCatalogItemResponse(type: ModelType, value: unknown): CatalogItemResponse {
    if (!isRecord(value) || !('item' in value)) {
        throw new Error('Invalid catalog response: expected an item.');
    }

    if (type === 'object') {
        if (!isObjectInfo(value.item)) {
            throw new Error('Invalid catalog response: invalid object item.');
        }

        return { item: value.item };
    }

    if (type === 'skin') {
        if (!isSkinInfo(value.item)) {
            throw new Error('Invalid catalog response: invalid skin item.');
        }

        return { item: value.item };
    }

    if (!isVehicleInfo(value.item)) {
        throw new Error('Invalid catalog response: invalid vehicle item.');
    }

    return { item: value.item };
}
