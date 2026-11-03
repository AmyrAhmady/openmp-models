import { isModelPlacements } from './placementCatalog';
import type { PlacementsResponse } from './placementCatalog';

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
