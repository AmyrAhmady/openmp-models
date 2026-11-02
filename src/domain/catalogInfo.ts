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
    ide: 'Definition File',
    drawdist: 'Draw Distance',
    type: 'Vehicle Type',
    handling: 'Handling ID',
    class: 'Vehicle Class',
    pedtype: 'Ped Type',
    animgroup: 'Animation Group',
};

const sizeLabels = ['Width', 'Depth', 'Height'];

export function getCatalogInfoRows(item: CatalogItem): InfoRow[] {
    return Object.entries(item).flatMap(([key, value]) =>
        key === 'size' && Array.isArray(value)
            ? sizeLabels.map((label, index) => ({
                  label,
                  value: `${value[index].toFixed(2)} m`,
              }))
            : [{ label: infoLabels[key] ?? 'Unknown info', value: String(value) }]
    );
}

export function getTextureInfoRows(texture: TextureDetails): InfoRow[] {
    return [
        { label: 'Name', value: texture.name },
        { label: 'Texture File', value: `${texture.txd}.txd` },
        { label: 'Size', value: `${texture.width} × ${texture.height}` },
        { label: 'Format', value: texture.format },
    ];
}
