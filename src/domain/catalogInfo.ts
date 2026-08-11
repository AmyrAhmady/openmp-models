import type { CatalogItem, InfoRow } from 'src/domain/catalog';

const infoLabels: Record<string, string> = {
    id: 'Model ID',
    model: 'Model Name',
    name: 'Name',
    cat: 'Category',
    mods: 'Modification',
    location: 'Location',
    gender: 'Gender',
    col: 'Has Collision',
    breakable: 'Is Breakable',
    visibility: 'Visibility Status',
    anime: 'Is Animated',
    radius: 'Radius',
    borderbox: 'Border Box',
    txd: 'Texture File',
};

export function getCatalogInfoRows(item: CatalogItem): InfoRow[] {
    return Object.entries(item).map(([key, value]) => ({
        label: infoLabels[key] ?? 'Unknown info',
        value: String(value),
    }));
}
