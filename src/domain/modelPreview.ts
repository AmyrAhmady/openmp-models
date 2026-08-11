import { getModelExport } from './modelAssetClient';
import type { ModelAssetRequestOptions } from './modelAssetClient';
import type { ModelExport } from './modelAssets';
import type { ModelType } from './modelType';

const MODEL_TEXTURE_BASE_URL = 'https://assets.open.mp/models/exports/';
const DEFAULT_VEHICLE_MODIFICATIONS = [1077, 1008];

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
                    url: `${MODEL_TEXTURE_BASE_URL}${normalizedTextureName}.png`,
                });
            }
        });
    });

    return textures;
}

function getRandomColor(random: RandomNumber): number {
    return Math.floor(random() * 255);
}

export function createModelPreviewData(
    name: string,
    type: ModelType,
    modelExport: ModelExport,
    random: RandomNumber = Math.random
): ModelPreviewData {
    return {
        type,
        name: name.trim().toLowerCase(),
        obj: modelExport,
        textures: getTextureData(modelExport),
        color: {
            primary: getRandomColor(random),
            secondary: getRandomColor(random),
        },
        ...(type === 'vehicle' ? { modifications: [...DEFAULT_VEHICLE_MODIFICATIONS] } : {}),
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
