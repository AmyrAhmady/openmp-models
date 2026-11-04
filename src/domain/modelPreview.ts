import { getModelExport } from './modelAssetClient';
import type { ModelAssetRequestOptions } from './modelAssetClient';
import type { ModelExport } from './modelAssets';
import type { ModelType } from './modelType';
import { getTextureUrl } from './textureCatalog';
import { vehicleColorValues } from './vehicleColors';

export interface ModelPreviewTexture {
    name: string;
    url: string;
}

export interface VehicleColorSelection {
    primary: number;
    secondary: number;
}

export interface ModelPreviewData {
    type: ModelType;
    name: string;
    obj: ModelExport;
    textures: ModelPreviewTexture[];
    color?: VehicleColorSelection;
    modifications?: number[];
}

export type RandomNumber = () => number;

function getTextureData(modelExport: ModelExport): ModelPreviewTexture[] {
    const textures: ModelPreviewTexture[] = [];
    const textureNames = new Set<string>();

    modelExport.forEach((frame) => {
        frame.geometry?.textures.forEach((texture) => {
            const textureName = texture.name.trim();
            const normalizedTextureName = textureName.toLowerCase();
            if (textureName && !textureNames.has(normalizedTextureName)) {
                textureNames.add(normalizedTextureName);
                textures.push({
                    name: textureName,
                    url: getTextureUrl(textureName),
                });
            }
        });
    });

    return textures;
}

function getRandomColor(random: RandomNumber): number {
    return Math.min(
        vehicleColorValues.length - 1,
        Math.floor(random() * vehicleColorValues.length)
    );
}

export function createModelPreviewData(
    name: string,
    type: ModelType,
    modelExport: ModelExport,
    random: RandomNumber = Math.random
): ModelPreviewData {
    const frames =
        type === 'vehicle'
            ? modelExport.filter((frame) => !frame.name.toLowerCase().includes('_vlo'))
            : modelExport;

    return {
        type,
        name: name.trim().toLowerCase(),
        obj: frames,
        textures: getTextureData(frames),
        color: {
            primary: getRandomColor(random),
            secondary: getRandomColor(random),
        },
    };
}

export async function getModelPreview(
    name: string,
    type: ModelType,
    options?: ModelAssetRequestOptions
): Promise<ModelPreviewData> {
    const modelExport = await getModelExport(name, options);
    return createModelPreviewData(name, type, modelExport);
}
