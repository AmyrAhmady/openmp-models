import { request } from 'src/api/request';
import type { PlacementsResponse } from 'src/domain/placementCatalog';
import { parsePlacementsResponse } from 'src/domain/placementResponses';

export const placementClient = {
    getItem(id: number, signal?: AbortSignal): Promise<PlacementsResponse> {
        return request<{ id: number }, PlacementsResponse>(
            'GET',
            '/api/placements/item',
            { id },
            signal ? { signal, parse: parsePlacementsResponse } : { parse: parsePlacementsResponse }
        );
    },
};
