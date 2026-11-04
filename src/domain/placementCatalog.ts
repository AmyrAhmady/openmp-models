import { getTextureUrl } from './textureCatalog';

export const MAP_TILE_COUNT = 12;
export const NEARBY_RADIUS = 50;

export const WORLD_SIZE = 6000;
const WORLD_EDGE = WORLD_SIZE / 2;

export type WorldPlacement = [number, number, number, number, number, number];
export type InteriorPlacement = [number, number, number, number, number, number, number];

export interface ModelPlacements {
    id: number;
    positions: WorldPlacement[];
    interiors: InteriorPlacement[];
}

export interface PlacementsResponse {
    item: ModelPlacements;
}

export interface MapPoint {
    x: number;
    y: number;
}

export interface NearbyObject {
    id: number;
    name: string;
    distance: number;
    count: number;
    position: [number, number];
}

export interface NearbyResponse {
    results: NearbyObject[];
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
        value.positions.every((position) => isPosition(position, 6)) &&
        Array.isArray(value.interiors) &&
        value.interiors.every((position) => isPosition(position, 7))
    );
}

export function isNearbyObject(value: unknown): value is NearbyObject {
    return (
        isRecord(value) &&
        Number.isInteger(value.id) &&
        typeof value.name === 'string' &&
        value.name.length > 0 &&
        typeof value.distance === 'number' &&
        Number.isFinite(value.distance) &&
        Number.isInteger(value.count) &&
        isPosition(value.position, 2)
    );
}

export function isWorldPoint(point: MapPoint): boolean {
    return Math.abs(point.x) <= WORLD_EDGE && Math.abs(point.y) <= WORLD_EDGE;
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
