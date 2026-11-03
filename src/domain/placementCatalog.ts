import { getTextureUrl } from './textureCatalog';

export const MAP_TILE_COUNT = 12;

const WORLD_SIZE = 6000;
const WORLD_EDGE = WORLD_SIZE / 2;

export type WorldPosition = [number, number, number];
export type InteriorPosition = [number, number, number, number];

export interface ModelPlacements {
    id: number;
    positions: WorldPosition[];
    interiors: InteriorPosition[];
}

export interface PlacementsResponse {
    item: ModelPlacements;
}

export interface MapPoint {
    x: number;
    y: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isPosition(value: unknown, length: number): boolean {
    return (
        Array.isArray(value) &&
        value.length === length &&
        value.every((part) => typeof part === 'number' && Number.isFinite(part))
    );
}

export function isModelPlacements(value: unknown): value is ModelPlacements {
    return (
        isRecord(value) &&
        Number.isInteger(value.id) &&
        Array.isArray(value.positions) &&
        value.positions.every((position) => isPosition(position, 3)) &&
        Array.isArray(value.interiors) &&
        value.interiors.every((position) => isPosition(position, 4))
    );
}

export function getRadarTileUrl(index: number): string {
    return getTextureUrl(`radar${String(index).padStart(2, '0')}`);
}

export function worldToMap(point: MapPoint, size: number): MapPoint {
    return {
        x: ((point.x + WORLD_EDGE) / WORLD_SIZE) * size,
        y: ((WORLD_EDGE - point.y) / WORLD_SIZE) * size,
    };
}

export function mapToWorld(point: MapPoint, size: number): MapPoint {
    return {
        x: (point.x / size) * WORLD_SIZE - WORLD_EDGE,
        y: WORLD_EDGE - (point.y / size) * WORLD_SIZE,
    };
}
