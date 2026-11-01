import { searchCatalog } from 'src/catalog/catalogSearch';
import { searchTextures } from 'src/catalog/textureRegistry';
import { GLOBAL_SEARCH_LIMIT } from 'src/domain/globalSearch';
import type { GlobalSearchResponse, SearchGroup } from 'src/domain/globalSearch';
import { normalizeSearchText } from 'src/domain/search';
import type { CatalogListItem } from 'src/domain/catalog';

function rankMatch(query: string, values: string[]): number {
    if (values.some((value) => value === query)) {
        return 0;
    }

    return values.some((value) => value.startsWith(query)) ? 1 : 2;
}

function groupResults<T>(
    results: T[],
    query: string,
    values: (item: T) => string[]
): SearchGroup<T> {
    const sorted = results
        .map((item) => ({ item, rank: rankMatch(query, values(item).map(normalizeSearchText)) }))
        .sort((a, b) => a.rank - b.rank)
        .map(({ item }) => item);

    return { results: sorted.slice(0, GLOBAL_SEARCH_LIMIT), total: results.length };
}

export function searchAll(query: string): GlobalSearchResponse {
    const normalizedQuery = normalizeSearchText(query.trim());
    const modelValues = (item: CatalogListItem) => [
        String(item.id),
        item.name,
        'model' in item ? item.model : '',
    ];

    return {
        vehicle: groupResults(searchCatalog('vehicle', query), normalizedQuery, modelValues),
        skin: groupResults(searchCatalog('skin', query), normalizedQuery, modelValues),
        object: groupResults(searchCatalog('object', query), normalizedQuery, modelValues),
        texture: groupResults(searchTextures(query), normalizedQuery, (item) => [
            item.name,
            item.txd,
        ]),
    };
}
