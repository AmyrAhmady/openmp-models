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
        Array.isArray(value.borderbox) &&
        value.borderbox.length === 3 &&
        value.borderbox.every(isFiniteNumber) &&
        isNonEmptyString(value.txd)
    );
}

export function isVehicleInfo(value: unknown): value is VehicleInfo {
    return (
        isRecord(value) &&
        Number.isInteger(value.id) &&
        isNonEmptyString(value.name) &&
        isNonEmptyString(value.cat) &&
        isNonEmptyString(value.mods) &&
        isNonEmptyString(value.model)
    );
}

export function isSkinInfo(value: unknown): value is SkinInfo {
    return (
        isRecord(value) &&
        Number.isInteger(value.id) &&
        isNonEmptyString(value.name) &&
        isNonEmptyString(value.model) &&
        isNonEmptyString(value.location) &&
        isNonEmptyString(value.gender)
    );
}
