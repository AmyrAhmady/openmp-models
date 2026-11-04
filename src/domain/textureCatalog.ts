import type { ModelType } from './modelType';

const TEXTURE_BASE_URL = 'https://assets.open.mp/models/exports/';

export interface TextureInfo {
    name: string;
    width: number;
    height: number;
    format: string;
    objects: number[];
    skins: number[];
    vehicles: number[];
}

export interface TextureDictionaryInfo {
    name: string;
    textures: TextureInfo[];
}

export interface TextureListItem {
    txd: string;
    name: string;
}

export interface TextureUsage {
    type: ModelType;
    id: number;
    name: string;
    model: string;
}

export interface TextureDetails extends TextureListItem {
    width: number;
    height: number;
    format: string;
    usedBy: TextureUsage[];
    dictionary: string[];
}

export interface TextureListResponse {
    list: TextureListItem[];
}

export interface TextureSearchResponse {
    results: TextureListItem[];
}

export interface TextureItemResponse {
    item: TextureDetails;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

function isIdList(value: unknown): value is number[] {
    return Array.isArray(value) && value.every((id) => Number.isInteger(id));
}

export function getTextureUrl(name: string): string {
    return `${TEXTURE_BASE_URL}${encodeURIComponent(name.toLowerCase())}.png`;
}

export function isTextureInfo(value: unknown): value is TextureInfo {
    return (
        isRecord(value) &&
        isNonEmptyString(value.name) &&
        Number.isInteger(value.width) &&
        Number.isInteger(value.height) &&
        isNonEmptyString(value.format) &&
        isIdList(value.objects) &&
        isIdList(value.skins) &&
        isIdList(value.vehicles)
    );
}

export function isTextureDictionaryInfo(value: unknown): value is TextureDictionaryInfo {
    return (
        isRecord(value) &&
        isNonEmptyString(value.name) &&
        Array.isArray(value.textures) &&
        value.textures.every(isTextureInfo)
    );
}
