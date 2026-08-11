import Objects from '../../data/source/catalogs/objects.json';
import Skins from '../../data/source/catalogs/skins.json';
import Vehicles from '../../data/source/catalogs/vehicles.json';
import { isObjectInfo, isSkinInfo, isVehicleInfo } from 'src/domain/catalogGuards';
import type {
    CatalogItem,
    CatalogListItem,
    CatalogListRegistry,
    CatalogRegistry,
    ModelType,
} from 'src/domain/catalog';

type CatalogGuard<T> = (value: unknown) => value is T;

function validateCatalog<T>(type: ModelType, value: unknown, guard: CatalogGuard<T>): T[] {
    if (!Array.isArray(value)) {
        throw new Error(`Catalog "${type}" must be an array`);
    }

    value.forEach((item, index) => {
        if (!guard(item)) {
            throw new Error(`Catalog "${type}" contains an invalid record at index ${index}`);
        }
    });

    return value;
}

function validateCatalogRegistry(value: Record<ModelType, unknown>): CatalogRegistry {
    return {
        object: validateCatalog('object', value.object, isObjectInfo),
        skin: validateCatalog('skin', value.skin, isSkinInfo),
        vehicle: validateCatalog('vehicle', value.vehicle, isVehicleInfo),
    };
}

export const catalogByType: CatalogRegistry = validateCatalogRegistry({
    object: Objects,
    skin: Skins,
    vehicle: Vehicles,
});

export const catalogListByType: CatalogListRegistry = {
    object: catalogByType.object.map(({ id, name }) => ({ id, name })),
    skin: catalogByType.skin.map(({ id, name, model }) => ({ id, name, model })),
    vehicle: catalogByType.vehicle.map(({ id, name, model }) => ({ id, name, model })),
};

const catalogById: Record<ModelType, Map<number, CatalogItem>> = {
    object: new Map(catalogByType.object.map((item) => [item.id, item])),
    skin: new Map(catalogByType.skin.map((item) => [item.id, item])),
    vehicle: new Map(catalogByType.vehicle.map((item) => [item.id, item])),
};

export function getCatalog(type: ModelType): CatalogItem[] {
    return catalogByType[type];
}

export function getCatalogList(type: ModelType): CatalogListItem[] {
    return catalogListByType[type];
}

export function getCatalogListPage(
    type: ModelType,
    offset: number,
    limit: number
): CatalogListItem[] {
    return catalogListByType[type].slice(offset, offset + limit);
}

export function findCatalogItem(type: ModelType, id: number): CatalogItem | undefined {
    return catalogById[type].get(id);
}
