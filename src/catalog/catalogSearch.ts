import { catalogByType } from 'src/catalog/catalogRegistry';
import type { CatalogItem, CatalogListItem, ModelType } from 'src/domain/catalog';
import { normalizeSearchText } from 'src/domain/search';

interface CatalogSearchEntry {
    item: CatalogListItem;
    normalizedId: string;
    normalizedName: string;
}

function toListItem(item: CatalogItem): CatalogListItem {
    if ('model' in item) {
        return { id: item.id, name: item.name, model: item.model };
    }

    return { id: item.id, name: item.name };
}

function createSearchIndex(items: CatalogItem[]): CatalogSearchEntry[] {
    return items.map((item) => ({
        item: toListItem(item),
        normalizedId: String(item.id),
        normalizedName: normalizeSearchText(item.name),
    }));
}

const searchIndex: Record<ModelType, CatalogSearchEntry[]> = {
    object: createSearchIndex(catalogByType.object),
    skin: createSearchIndex(catalogByType.skin),
    vehicle: createSearchIndex(catalogByType.vehicle),
};

export function searchCatalog(type: ModelType, query: string): CatalogListItem[] {
    const normalizedQuery = normalizeSearchText(query.trim());
    if (!normalizedQuery) {
        return [];
    }

    return searchIndex[type]
        .filter(
            ({ normalizedId, normalizedName }) =>
                normalizedName.includes(normalizedQuery) || normalizedId.includes(normalizedQuery)
        )
        .sort((a, b) => a.normalizedName.localeCompare(b.normalizedName))
        .map(({ item }) => item);
}
