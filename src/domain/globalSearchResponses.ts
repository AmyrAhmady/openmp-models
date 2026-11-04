import { isListItem } from './catalogResponses';
import type { GlobalSearchResponse, SearchGroup } from './globalSearch';
import { isTextureListItem } from './textureResponses';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isGroup<T>(value: unknown, isItem: (item: unknown) => item is T): value is SearchGroup<T> {
    return (
        isRecord(value) &&
        Array.isArray(value.results) &&
        value.results.every(isItem) &&
        Number.isInteger(value.total)
    );
}

export function parseGlobalSearchResponse(value: unknown): GlobalSearchResponse {
    if (
        !isRecord(value) ||
        !isGroup(value.vehicle, isListItem) ||
        !isGroup(value.skin, isListItem) ||
        !isGroup(value.object, isListItem) ||
        !isGroup(value.texture, isTextureListItem)
    ) {
        throw new Error('Invalid search response: expected grouped results.');
    }

    return {
        vehicle: value.vehicle,
        skin: value.skin,
        object: value.object,
        texture: value.texture,
    };
}
