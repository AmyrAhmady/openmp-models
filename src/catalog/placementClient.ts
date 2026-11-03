import { request } from 'src/api/request';
import type { MapPoint, NearbyResponse, PlacementsResponse } from 'src/domain/placementCatalog';
import { parseNearbyResponse, parsePlacementsResponse } from 'src/domain/placementResponses';

export const placementClient = {
    getItem(id: number, signal?: AbortSignal): Promise<PlacementsResponse> {
        return request<{ id: number }, PlacementsResponse>(
            'GET',
            '/api/placements/item',
            { id },
            signal ? { signal, parse: parsePlacementsResponse } : { parse: parsePlacementsResponse }
        );
    },

    nearby(point: MapPoint, signal?: AbortSignal): Promise<NearbyResponse> {
        return request<{ x: number; y: number }, NearbyResponse>(
            'GET',
            '/api/placements/nearby',
            { x: point.x, y: point.y },
            signal ? { signal, parse: parseNearbyResponse } : { parse: parseNearbyResponse }
        );
    },
};
