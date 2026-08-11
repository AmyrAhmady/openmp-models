import type { ModelType } from './modelType';

export type { ModelType } from './modelType';

export interface ObjectInfo {
    id: number;
    name: string;
    col: boolean;
    breakable: boolean;
    visibility: string;
    anime: boolean;
    radius: number;
    borderbox: number[];
    txd: string;
}

export interface VehicleInfo {
    id: number;
    name: string;
    cat: string;
    mods: string;
    model: string;
}

export interface SkinInfo {
    id: number;
    name: string;
    model: string;
    location: string;
    gender: string;
}

export interface CatalogRegistry {
    object: ObjectInfo[];
    skin: SkinInfo[];
    vehicle: VehicleInfo[];
}

export type CatalogItem = CatalogRegistry[ModelType][number];

export interface ObjectListInfo {
    id: number;
    name: string;
}

export interface VehicleListInfo {
    id: number;
    name: string;
    model: string;
}

export interface SkinListInfo {
    id: number;
    name: string;
    model: string;
}

export interface CatalogListRegistry {
    object: ObjectListInfo[];
    skin: SkinListInfo[];
    vehicle: VehicleListInfo[];
}

export type CatalogListItem = CatalogListRegistry[ModelType][number];

export interface InfoRow {
    label: string;
    value: number | string;
}

export interface CatalogListResponse {
    list: CatalogListItem[];
}

export interface CatalogSearchResponse {
    results: CatalogListItem[];
}

export interface CatalogItemResponse {
    item: CatalogItem;
}

export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
    };
}

export function isModelType(value: unknown): value is ModelType {
    return value === 'object' || value === 'skin' || value === 'vehicle';
}

export function queryValue(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) {
        return value.length === 1 ? value[0] : undefined;
    }

    return value;
}
