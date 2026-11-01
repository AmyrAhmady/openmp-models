import type { CatalogItem, InfoRow } from 'src/domain/catalog';
import type { TextureDetails } from 'src/domain/textureCatalog';

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

export function getTextureInfoRows(texture: TextureDetails): InfoRow[] {
    return [
        { label: 'Name', value: texture.name },
        { label: 'Texture File', value: `${texture.txd}.txd` },
        { label: 'Size', value: `${texture.width} × ${texture.height}` },
        { label: 'Format', value: texture.format },
    ];
}
