import type { ObjectInfo, SkinInfo, VehicleInfo } from './catalog';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.length > 0;
}

function isVector3(value: unknown): value is number[] {
    return Array.isArray(value) && value.length === 3 && value.every(isFiniteNumber);
}

function isOptionalSize(value: unknown): boolean {
    return value === undefined || isVector3(value);
}

export function isObjectInfo(value: unknown): value is ObjectInfo {
    return (
        isRecord(value) &&
        Number.isInteger(value.id) &&
        isNonEmptyString(value.name) &&
        typeof value.col === 'boolean' &&
        typeof value.breakable === 'boolean' &&
        isNonEmptyString(value.visibility) &&
        typeof value.anime === 'boolean' &&
        isFiniteNumber(value.radius) &&
        isVector3(value.borderbox) &&
        isNonEmptyString(value.txd) &&
        isNonEmptyString(value.ide) &&
        isFiniteNumber(value.drawdist) &&
        isOptionalSize(value.size)
    );
}

export function isVehicleInfo(value: unknown): value is VehicleInfo {
    return (
        isRecord(value) &&
        Number.isInteger(value.id) &&
        isNonEmptyString(value.name) &&
        isNonEmptyString(value.cat) &&
        isNonEmptyString(value.mods) &&
        isNonEmptyString(value.model) &&
        isNonEmptyString(value.txd) &&
        isNonEmptyString(value.type) &&
        isNonEmptyString(value.handling) &&
        isNonEmptyString(value.class) &&
        isOptionalSize(value.size)
    );
}

export function isSkinInfo(value: unknown): value is SkinInfo {
    return (
        isRecord(value) &&
        Number.isInteger(value.id) &&
        isNonEmptyString(value.name) &&
        isNonEmptyString(value.model) &&
        isNonEmptyString(value.location) &&
        isNonEmptyString(value.gender) &&
        isNonEmptyString(value.txd) &&
        isNonEmptyString(value.pedtype) &&
        isNonEmptyString(value.animgroup) &&
        isOptionalSize(value.size)
    );
}
