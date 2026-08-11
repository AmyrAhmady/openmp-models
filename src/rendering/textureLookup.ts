export interface TextureLookupEntry {
    name: string;
    url: string;
}

export function normalizeTextureName(name: string): string {
    return name.trim().toLowerCase();
}

export function createTextureUrlLookup(
    textures: readonly TextureLookupEntry[]
): Map<string, string> {
    const lookup = new Map<string, string>();

    for (const texture of textures) {
        const normalizedName = normalizeTextureName(texture.name);
        if (normalizedName && !lookup.has(normalizedName)) {
            lookup.set(normalizedName, texture.url);
        }
    }

    return lookup;
}
