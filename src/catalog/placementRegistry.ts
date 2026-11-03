import Placements from '../../data/source/catalogs/placements.json';
import { findCatalogItem } from 'src/catalog/catalogRegistry';
import { isModelPlacements } from 'src/domain/placementCatalog';
import type { MapPoint, ModelPlacements, NearbyObject } from 'src/domain/placementCatalog';

function validatePlacementCatalog(value: unknown): ModelPlacements[] {
    if (!Array.isArray(value)) {
        throw new Error('Placement catalog must be an array');
    }

    value.forEach((item, index) => {
        if (!isModelPlacements(item)) {
            throw new Error(`Placement catalog contains an invalid record at index ${index}`);
        }
    });

    return value;
}

const placementsById = new Map(
    validatePlacementCatalog(Placements).map((placements) => [placements.id, placements])
);

export function findPlacements(id: number): ModelPlacements {
    return placementsById.get(id) ?? { id, positions: [], interiors: [] };
}

export function findNearbyObjects(point: MapPoint, radius: number): NearbyObject[] {
    const results: NearbyObject[] = [];
    placementsById.forEach(({ id, positions }) => {
        const nearby = positions
            .map(([x, y]) => ({
                position: [x, y] as [number, number],
                distance: Math.hypot(x - point.x, y - point.y),
            }))
            .filter(({ distance }) => distance <= radius);
        const item = nearby.length ? findCatalogItem('object', id) : undefined;
        if (!item) {
            return;
        }

        const nearest = nearby.reduce((best, current) =>
            current.distance < best.distance ? current : best
        );
        results.push({ id, name: item.name, count: nearby.length, ...nearest });
    });

    return results.sort((left, right) => left.distance - right.distance || left.id - right.id);
}
