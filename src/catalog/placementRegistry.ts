import Placements from '../../data/source/catalogs/placements.json';
import { isModelPlacements } from 'src/domain/placementCatalog';
import type { ModelPlacements } from 'src/domain/placementCatalog';

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
