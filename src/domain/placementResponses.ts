import { isModelPlacements, isNearbyObject } from './placementCatalog';
import type { NearbyResponse, PlacementsResponse } from './placementCatalog';

export function parsePlacementsResponse(value: unknown): PlacementsResponse {
    if (
        typeof value !== 'object' ||
        value === null ||
        !('item' in value) ||
        !isModelPlacements(value.item)
    ) {
        throw new Error('Invalid placements response: expected an item.');
    }

    return { item: value.item };
}

export function parseNearbyResponse(value: unknown): NearbyResponse {
    if (
        typeof value !== 'object' ||
        value === null ||
        !('results' in value) ||
        !Array.isArray(value.results) ||
        !value.results.every(isNearbyObject)
    ) {
        throw new Error('Invalid nearby response: expected a results array.');
    }

    return { results: value.results };
}
