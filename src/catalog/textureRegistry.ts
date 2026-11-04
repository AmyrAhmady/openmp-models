import Textures from '../../data/source/catalogs/textures.json';
import { findCatalogItem } from 'src/catalog/catalogRegistry';
import { getPreviewName } from 'src/domain/globalSearch';
import { normalizeSearchText } from 'src/domain/search';
import { isTextureDictionaryInfo } from 'src/domain/textureCatalog';
import type {
    TextureDetails,
    TextureDictionaryInfo,
    TextureInfo,
    TextureListItem,
    TextureUsage,
} from 'src/domain/textureCatalog';
import type { ModelType } from 'src/domain/catalog';

function validateTextureCatalog(value: unknown): TextureDictionaryInfo[] {
    if (!Array.isArray(value)) {
        throw new Error('Texture catalog must be an array');
    }

    value.forEach((item, index) => {
        if (!isTextureDictionaryInfo(item)) {
            throw new Error(`Texture catalog contains an invalid record at index ${index}`);
        }
    });

    return value;
}

const dictionaries = validateTextureCatalog(Textures);

const textureList: TextureListItem[] = dictionaries.flatMap((dictionary) =>
    dictionary.textures.map((texture) => ({ txd: dictionary.name, name: texture.name }))
);

const searchIndex = textureList.map((item) => ({
    item,
    normalizedTxd: normalizeSearchText(item.txd),
    normalizedName: normalizeSearchText(item.name),
}));

const dictionaryByName = new Map(
    dictionaries.map((dictionary) => [dictionary.name.toLowerCase(), dictionary])
);

function getUsage(texture: TextureInfo): TextureUsage[] {
    const usage: TextureUsage[] = [];
    const add = (type: ModelType, ids: number[]) => {
        ids.forEach((id) => {
            const item = findCatalogItem(type, id);
            if (item) {
                usage.push({ type, id, name: item.name, model: getPreviewName(item) });
            }
        });
    };

    add('object', texture.objects);
    add('skin', texture.skins);
    add('vehicle', texture.vehicles);
    return usage;
}

export function getTextureListPage(offset: number, limit: number): TextureListItem[] {
    return textureList.slice(offset, offset + limit);
}

export function searchTextures(query: string): TextureListItem[] {
    const normalizedQuery = normalizeSearchText(query.trim());
    if (!normalizedQuery) {
        return [];
    }

    return searchIndex
        .filter(
            ({ normalizedTxd, normalizedName }) =>
                normalizedName.includes(normalizedQuery) || normalizedTxd.includes(normalizedQuery)
        )
        .map(({ item }) => item);
}

function normalizeTextureName(name: string): string {
    return name.trim().toLowerCase();
}

export function findTexture(txd: string, name: string): TextureDetails | undefined {
    const dictionary = dictionaryByName.get(txd.toLowerCase());
    const normalizedName = normalizeTextureName(name);
    const texture = dictionary?.textures.find(
        (candidate) => normalizeTextureName(candidate.name) === normalizedName
    );
    if (!dictionary || !texture) {
        return undefined;
    }

    return {
        txd: dictionary.name,
        name: texture.name,
        width: texture.width,
        height: texture.height,
        format: texture.format,
        usedBy: getUsage(texture),
        dictionary: dictionary.textures.map((candidate) => candidate.name),
    };
}

export function findModelTextureDictionary(
    type: ModelType,
    id: number,
    name: string
): string | undefined {
    const key = type === 'object' ? 'objects' : type === 'skin' ? 'skins' : 'vehicles';
    const normalizedName = normalizeTextureName(name);

    return dictionaries.find((dictionary) =>
        dictionary.textures.some(
            (texture) =>
                normalizeTextureName(texture.name) === normalizedName && texture[key].includes(id)
        )
    )?.name;
}
