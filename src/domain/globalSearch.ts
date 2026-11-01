import type { CatalogItem, CatalogListItem } from './catalog';
import type { TextureListItem } from './textureCatalog';

const MODEL_PREVIEW_BASE_URL = 'https://assets.open.mp/models/previews/';

export const GLOBAL_SEARCH_LIMIT = 5;

export interface SearchGroup<T> {
    results: T[];
    total: number;
}

export interface GlobalSearchResponse {
    vehicle: SearchGroup<CatalogListItem>;
    skin: SearchGroup<CatalogListItem>;
    object: SearchGroup<CatalogListItem>;
    texture: SearchGroup<TextureListItem>;
}

export function getPreviewName(item: CatalogItem | CatalogListItem): string {
    return 'model' in item ? item.model : item.name;
}

export function getModelPreviewUrl(name: string): string {
    return `${MODEL_PREVIEW_BASE_URL}${name.trim().toLowerCase()}.png`;
}
